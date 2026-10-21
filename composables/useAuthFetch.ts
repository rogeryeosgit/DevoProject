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

  // Taken before the first await: during SSR the Nuxt context is gone after
  // one, and calling useState() in the catch below would throw its own error
  // in place of the real API failure.
  const lastErrorRef = useLastErrorRef()
  lastErrorRef.value = null
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
          reportClientEvent('warn', 'auth', 'forced logout: the server still rejected the session after a token refresh', { detail: `${url}: ${describeClientError(retryErr)}` })
        }
      } else {
        reportClientEvent('warn', 'auth', 'forced logout: API returned 401 and there is no signed-in Firebase user', { detail: url })
      }
      await userStore.logout()
    }
    lastErrorRef.value = errorRef(err) ?? null
    throw err
  }
}

/**
 * The reference code the server put on a failed API response (x-error-ref
 * header, set in server/plugins/logging.ts). The same code prefixes that
 * request's lines in QTApp.log, so a user who quotes it can be looked up with
 * `grep <ref> logs/QTApp*.log`. Accepts a raw ofetch FetchError, or the
 * NuxtError useAsyncData wraps it in (original kept as `cause`).
 */
export function errorRef(err: any): string | undefined {
  const fromHeader = (e: any) => e?.response?.headers?.get?.('x-error-ref') as string | null | undefined
  return fromHeader(err) ?? fromHeader(err?.cause) ?? err?.data?.ref ?? undefined
}

function useLastErrorRef() {
  return useState<string | null>('lastErrorRef', () => null)
}

/**
 * Records a failure's reference code (or clears it) for withErrorRef(), for
 * calls made outside authFetch. Call it before any await, or client-side only.
 */
export function rememberErrorRef(err: any): void {
  useLastErrorRef().value = err ? (errorRef(err) ?? null) : null
}

/**
 * The reference code for an error a page is about to show: from the error
 * itself if it still carries the response, otherwise the one authFetch
 * recorded when the call failed (useAsyncData may wrap the original error -
 * in dev, in a diagnostic object without the response).
 */
export function latestErrorRef(err?: any): string | undefined {
  return errorRef(err) ?? useLastErrorRef().value ?? undefined
}

/** Appends the latest API failure's reference code to a user-facing error message. */
export function withErrorRef(text: string): string {
  const ref = useLastErrorRef().value
  return ref ? `${text} (Error ref: ${ref})` : text
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
