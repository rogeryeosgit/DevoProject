import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type Auth
} from 'firebase/auth'

interface UserState {
  token: string | null
  exTime: number | null
  userID: string | null
  error: any
}

// Shared by email verification (below) and password reset
// (pages/auth/index.vue) - both are Firebase action-code emails whose
// "continue" link should land back on the app. Derived from the current
// origin rather than hardcoded, so this actually works in every environment:
// dev and prod talk to DIFFERENT Firebase projects, each with its own
// authorized-domains allowlist, and Firebase rejects sendEmailVerification/
// sendPasswordResetEmail outright (auth/unauthorized-continue-uri) if the
// continue URL isn't on that project's list - a URL that's valid in
// production is never valid for local dev's project, and vice versa. Client
// -only by construction (both call sites are user-triggered actions that
// never run during SSR), so `window` is always safe here.
//
// The shared Navigators email-action handler (a separate static page, not
// part of this app) reads this as `continueUrl` and offers it as a "back to
// the app" link once the action succeeds - `path` lets a caller land
// somewhere more useful than the bare origin. Verification uses
// /auth/verify-email so its own graduation logic runs immediately; password
// reset has no such page, so it stays at the origin.
export function authContinueUrl(path?: string): string {
  return path ? new URL(path, window.location.origin).toString() : window.location.origin
}

function firebaseAuth(): Auth {
  return useNuxtApp().$firebaseAuth as Auth
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: null,
    exTime: null,
    userID: null,
    error: null
  }),

  getters: {
    getToken: (state) => state.token,
    isAuthenticated: (state) => state.token != null,
    getExpiryTime: (state) => state.exTime,
    getUserID: (state) => state.userID,
    errorOccured: (state) => state.error,
    getErrorMessage: (state) => {
      const code = state.error?.code
      switch (code) {
        case 'auth/email-already-in-use':
          return 'An account already exists for this email. Try logging in, or use Sign in with Google.'
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          return 'Incorrect email or password.'
        case 'auth/user-not-found':
          return 'No account found for that email.'
        case 'auth/weak-password':
          return 'Password is too weak - please use at least 6 characters.'
        case 'auth/invalid-email':
          return "That doesn't look like a valid email address."
        default:
          // Failed POST /api/users/verify calls (Firebase sign-in succeeded,
          // but the app-level step after it didn't) throw an ofetch error
          // shaped { response: { status } }, not a Firebase auth `.code` -
          // give those their own messages rather than the misleading generic
          // one below, since the person IS actually signed in at this point.
          if (state.error?.response?.status === 503) {
            return "You're signed in, but we couldn't finish setting up your account. Please try logging in again."
          }
          if (state.error?.response?.status === 403) {
            return 'Please verify your email before logging in - check your inbox (and spam folder) for the verification link we sent you.'
          }
          return 'Authentication failed'
      }
    }
  },

  actions: {
    /**
     * Single write path for token/cookie state. Called right after login/register,
     * and by the firebase-token-sync plugin's onIdTokenChanged listener whenever
     * Firebase silently refreshes the token (initial load, ~5min before expiry,
     * tab focus).
     */
    applyToken({ token, expiry, userID }: { token: string; expiry: number; userID: string }) {
      this.token = token
      this.exTime = expiry
      this.userID = userID

      const cookieOpts = { sameSite: 'lax' as const, expires: new Date(expiry), secure: true }
      useCookie('jwt', cookieOpts).value = token
      useCookie('expirationTime', cookieOpts).value = String(expiry)
      useCookie('qtAppID', cookieOpts).value = userID
    },

    // Returns true/false directly rather than making callers check
    // errorOccured afterward - that property is shared, mutable state, and
    // the snackbar watcher below reacts to it by immediately calling
    // clearError(); depending on microtask ordering, that reactivity flush
    // can run before a caller's own post-await check ever sees it, which is
    // exactly the race that let a pending-verification login through
    // (confirmed locally: userStore.error read back as null immediately
    // after a call that definitely 403'd). A direct return value can't be
    // raced by an unrelated watcher's side effect.
    async authenticateUser(authData: { isLogin: boolean; id: string; pwd: string }): Promise<boolean> {
      try {
        if (authData.isLogin) {
          await signInWithEmailAndPassword(firebaseAuth(), authData.id, authData.pwd)
          // Attach the just-obtained token directly to this one call - cookie/Pinia
          // sync happens via onIdTokenChanged (the firebase-token-sync plugin),
          // triggered by the sign-in above, not yet by the time we get here.
          const idToken = await firebaseAuth().currentUser!.getIdToken()
          await $fetch('/api/users/verify', {
            method: 'POST',
            headers: { Authorization: `Bearer ${idToken}` }
          })
        } else {
          const cred = await createUserWithEmailAndPassword(firebaseAuth(), authData.id, authData.pwd)
          // Deliberately not calling /api/users/verify here - checkUser would
          // reject it anyway (fresh account, not verified yet), and it's
          // pointless noise right after a successful signup. This is instead
          // what marks the account as needing verification -
          // server/api/users/register.post.ts is the only place that happens.
          //
          // Called BEFORE sendEmailVerification, not after: this is the one
          // call that sets pendingVerification, and the gate (checkUser) can
          // only tell "our own half-finished registration" apart from "a
          // sibling app's account logging in for the first time" via that
          // flag - so if this never runs, the account is unverified in
          // Firebase's eyes but permanently ungated in qtapp's. That's exactly
          // what sendEmailVerification going first risked: it's a third-party
          // call to Firebase's own send infrastructure, which rate-limits
          // (auth/too-many-requests, confirmed happening against this same
          // project) independently of anything qtapp controls - a transient
          // failure there must not be able to skip this.
          const idToken = await cred.user.getIdToken()
          await $fetch('/api/users/register', {
            method: 'POST',
            headers: { Authorization: `Bearer ${idToken}` }
          })
          // Best-effort from here on - the account is already correctly
          // gated regardless of whether the email itself goes out. If this
          // throws, the verify-email page's own "Resend Email" covers it.
          try {
            await sendEmailVerification(cred.user, { url: authContinueUrl('/auth/verify-email') })
          } catch (e) {
            reportAuthFailure('sending the verification email after registration', e, authData.id)
          }
        }
        return true
      } catch (e) {
        this.error = e
        reportAuthFailure(authData.isLogin ? 'login' : 'registration', e, authData.id)
        return false
      }
    },

    /**
     * The "I've verified - continue" action on pages/auth/verify-email. Firebase's
     * `reload()` refreshes the local user profile's `emailVerified` flag, but the
     * ID token's `email_verified` *claim* - what checkUser actually reads - stays
     * stale until explicitly force-refreshed; without that, this would still
     * 403 immediately after a genuine verification. Returns true once the
     * account is confirmed usable (provisioned server-side), false if it's
     * still not verified.
     */
    async completeVerification(): Promise<boolean> {
      const user = firebaseAuth().currentUser
      if (!user) return false

      await user.reload()
      if (!user.emailVerified) return false

      const idToken = await user.getIdToken(true)
      await $fetch('/api/users/verify', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` }
      })
      return true
    },

    clearError() {
      this.error = null
    },

    async authenticateWithGoogle(): Promise<boolean> {
      try {
        const provider = new GoogleAuthProvider()
        const result = await signInWithPopup(firebaseAuth(), provider)
        const idToken = await result.user.getIdToken()

        await $fetch('/api/users/verify', {
          method: 'POST',
          headers: { Authorization: `Bearer ${idToken}` }
        })
        return true
      } catch (e) {
        this.token = null
        this.exTime = null
        this.userID = null
        this.error = e
        reportAuthFailure('Google sign-in', e)
        return false
      }
    },

    /**
     * Rehydrates token/exTime/userID from cookies. useCookie() is SSR-universal
     * (reads request headers server-side, document.cookie client-side) with the
     * same code path either way - this replaces the old Nuxt 2 split between
     * manual req.headers.cookie parsing and js-cookie.
     */
    syncFromCookies() {
      const token = useCookie('jwt').value
      const expirationTime = useCookie('expirationTime').value
      const userID = useCookie('qtAppID').value

      if (!token || Date.now() > Number(expirationTime)) {
        // Give Firebase's silent refresh a chance before logging out (client-only -
        // there's no live Firebase session to check during SSR).
        if (import.meta.client && firebaseAuth()?.currentUser) {
          return
        }
        this.logout()
        return
      }

      this.token = token
      this.exTime = Number(expirationTime)
      this.userID = userID ?? null
    },

    // checkCookie (SSR rehydration middleware) and syncCookie (client "make sure
    // axios/token agree" calls) collapse into the same implementation now that
    // useCookie() removes the server/client branching that used to separate them.
    checkCookie() {
      this.syncFromCookies()
    },
    syncCookie() {
      this.syncFromCookies()
    },

    async logout() {
      this.token = null
      this.exTime = null
      this.userID = null

      useCookie('jwt').value = null
      useCookie('expirationTime').value = null
      useCookie('qtAppID').value = null
      useCookie('lastActiveAt').value = null

      const planStore = usePlanStore()
      const journalStore = useJournalStore()
      planStore.clearPlans()
      journalStore.clearEntries()

      // Sweep autosaved journal drafts too, so a shared-device logout doesn't
      // leave one visible to the next person. logout() can run server-side (from
      // syncFromCookies during SSR), so guard localStorage to the client.
      if (import.meta.client && window.localStorage) {
        Object.keys(window.localStorage)
          .filter((key) => key.startsWith('qtDraft:'))
          .forEach((key) => window.localStorage.removeItem(key))
      }

      // Sign out of Firebase too, so the SDK stops silently re-issuing tokens.
      // This triggers onIdTokenChanged(null), which re-enters logout - harmless,
      // this action is idempotent.
      if (import.meta.client && firebaseAuth()?.currentUser) {
        await signOut(firebaseAuth())
      }
    }
  }
})
