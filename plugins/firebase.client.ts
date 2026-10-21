import { initializeApp, getApps } from 'firebase/app'
import { getAuth, onIdTokenChanged } from 'firebase/auth'

// Keeps the Pinia userStore's token/cookie state in sync with Firebase's
// client-side auth session. Firebase auto-refreshes the ID token ~5min before
// it expires (and manages the refresh token in IndexedDB) - this plugin
// listens for every refresh via onIdTokenChanged and re-applies the fresh
// token to cookies/Pinia via userStore.applyToken. It also fires once on
// initial load with the persisted user (if any), so returning after the tab
// was closed restores the session instead of forcing a re-login.
//
// On top of that, it enforces a rolling 3-day idle cap: every real token
// refresh (login, proactive refresh, or a tab-focus-triggered refresh) resets
// a 3-day window via the `lastActiveAt` cookie. If a refresh ever happens more
// than 3 days after the previous one, the session is force-signed-out instead
// of silently extended. `lastActiveAt` itself is given a much longer
// browser-side shelf life (90 days) than the 3-day cap it tracks, so it's this
// code - not the cookie's own expiry - that enforces the cap.
const IDLE_CAP_MS = 3 * 24 * 60 * 60 * 1000

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const app = getApps().length > 0 ? getApps()[0]! : initializeApp(config.public.firebase)
  const auth = getAuth(app)

  const userStore = useUserStore()

  onIdTokenChanged(auth, async (user) => {
    if (!user) {
      userStore.logout()
      return
    }

    const lastActiveCookie = useCookie('lastActiveAt')
    const lastActive = lastActiveCookie.value
    if (lastActive && Date.now() - Number(lastActive) > IDLE_CAP_MS) {
      reportClientEvent('info', 'auth', 'forced logout: no activity for over 3 days (idle cap)', { email: user.email })
      userStore.logout()
      return
    }
    useCookie('lastActiveAt', {
      sameSite: 'lax',
      secure: true,
      maxAge: 60 * 60 * 24 * 90
    }).value = String(Date.now())

    try {
      const result = await user.getIdTokenResult()
      userStore.applyToken({
        token: result.token,
        expiry: new Date(result.expirationTime).getTime(),
        userID: user.email!
      })
    } catch (e) {
      reportClientError('auth: applying a refreshed token failed', e)
    }
  })

  // Covers laptops waking from sleep, where an in-tab refresh timer would have
  // been suspended: on tab focus, ask Firebase for the current token. Firebase
  // only hits the network if it's actually near/past expiry; either way, a
  // resulting refresh is picked up by onIdTokenChanged above.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && auth.currentUser) {
      auth.currentUser.getIdToken().catch(e => reportClientError('auth: token refresh on returning to the tab failed', e))
    }
  })

  return {
    provide: {
      firebaseAuth: auth
    }
  }
})
