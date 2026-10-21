import type { Auth } from 'firebase/auth'

/**
 * $fetch wrapper that attaches the current user's Bearer token to protected
 * API calls. Centralizes what used to be $axios.setToken's automatic header
 * injection - stores just call authFetch(...) instead of each managing headers.
 *
 * Also carries the 401 retry-once backstop that used to live in plugins/axios.js:
 * on a 401 (stale token from clock skew, or a refresh that hasn't landed yet),
 * force a fresh ID token and retry the request exactly once before giving up and
 * logging out. Normal expiry is handled proactively by plugins/firebase.client.ts,
 * so this should rarely fire.
 */
export async function authFetch<T = any>(url: string, opts: Record<string, any> = {}): Promise<T> {
  const userStore = useUserStore()

  const withToken = (token: string | null) => {
    const headers: Record<string, string> = { ...(opts.headers || {}) }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return { ...opts, headers }
  }

  try {
    return (await $fetch<T>(url, withToken(userStore.token))) as T
  } catch (err: any) {
    if (import.meta.client && err?.response?.status === 401) {
      const auth = useNuxtApp().$firebaseAuth as Auth | undefined
      const currentUser = auth?.currentUser
      if (currentUser) {
        try {
          const freshToken = await currentUser.getIdToken(true)
          userStore.token = freshToken
          return (await $fetch<T>(url, withToken(freshToken))) as T
        } catch (retryErr) {
          console.error(retryErr)
        }
      }
      await userStore.logout()
    }
    throw err
  }
}

/**
 * checkUser's verification gate (server/utils/auth.ts) throws this - distinct
 * from a plain 401, since the person IS authenticated, just not verified yet,
 * and distinct from requireOwner's 403 (statusMessage "Forbidden"), which must
 * NOT redirect to the verify-email page. Pages that convert ANY useAsyncData
 * error into their own generic createError (several do, to show one clean
 * message instead of a raw fetch failure) need to check this FIRST and
 * navigate instead - see those pages for why authFetch can't just handle this
 * by itself: a throw from deep inside it is silently swallowed into
 * useAsyncData's error ref either way, so whichever code checks that ref is
 * the only place that can reliably decide what happens next.
 */
export function isEmailNotVerifiedError(err: any): boolean {
  if (!err) return false
  // Checks both shapes: a raw ofetch FetchError (.response.status/.data...)
  // caught directly, and the NuxtError useAsyncData normalizes thrown errors
  // into for its `error` ref (.statusCode/.statusMessage directly) - callers
  // pass either, so this can't assume just one.
  const statusCode = err.statusCode ?? err.response?.status
  if (statusCode !== 403) return false
  // err.statusMessage mirrors the HTTP status line's reason phrase - which
  // only exists in HTTP/1.1. Production (behind Cloudflare) serves HTTP/2,
  // which has no reason phrase at the protocol level at all, so browsers
  // report err.statusMessage as "" there regardless of what createError set
  // server-side (confirmed: the response body still correctly carries
  // statusMessage "Email not verified", only the transport-level one comes
  // back empty). `??` doesn't fall through on that - "" is not nullish - so
  // the body's statusMessage/message must be checked FIRST, not last.
  return err.data?.statusMessage === 'Email not verified'
    || err.data?.message === 'Email not verified'
    || err.statusMessage === 'Email not verified'
}
