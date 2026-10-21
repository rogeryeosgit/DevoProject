// Sends problems users hit in the browser to QTApp.log through
// /api/client-log (server/api/client-log.post.ts), so they no longer exist
// only in that user's own browser console. Fire-and-forget: never throws,
// never awaits, and never reports its own failures.

type ClientLogLevel = 'info' | 'warn' | 'error'

// A render loop can throw the same error hundreds of times; one report per
// distinct message, and at most this many per page load, is enough.
const MAX_REPORTS_PER_PAGE_LOAD = 20
const reported = new Set<string>()

export function describeClientError(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`
  if (typeof err === 'string') return err
  try {
    return JSON.stringify(err)
  } catch {
    return String(err)
  }
}

/**
 * Reports an event to QTApp.log as a `CLIENT: [category] message` line.
 * `email` is only recorded for the auth category (sign-in failures, before a
 * token exists); signed-in users are identified server-side from their token.
 */
export function reportClientEvent(
  level: ClientLogLevel,
  category: string,
  message: string,
  extra: { detail?: string; email?: string | null } = {}
): void {
  if (!import.meta.client) return
  try {
    const key = `${level}|${message}`
    if (reported.has(key) || reported.size >= MAX_REPORTS_PER_PAGE_LOAD) return
    reported.add(key)

    let token: string | null = null
    let appVersion: string | undefined
    try {
      token = useUserStore().token
      appVersion = useRuntimeConfig().public.appVersion as string
    } catch {}

    const headers: Record<string, string> = { 'content-type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    fetch('/api/client-log', {
      method: 'POST',
      headers,
      keepalive: true, // still delivered if the page is navigating away
      body: JSON.stringify({
        level,
        category,
        message: message.slice(0, 300),
        detail: extra.detail?.slice(0, 500),
        email: extra.email?.slice(0, 100),
        path: `${location.pathname}${location.search}`.slice(0, 200),
        appVersion
      })
    }).catch(() => {})
  } catch {}
}

/**
 * console.error (as before) plus a report to QTApp.log. API failures the
 * server already logged go in as warnings for 4xx, with the server's
 * reference code so the browser and server lines can be matched up.
 */
export function reportClientError(context: string, err: unknown): void {
  console.error(context, err)
  const e = err as any
  const status: number | undefined = e?.response?.status ?? e?.statusCode
  const ref = errorRef(e)
  const detail = [status ? `HTTP ${status}` : '', ref ? `server ref ${ref}` : ''].filter(Boolean).join(', ')
  // 4xx and the user's own connection dropping are worth knowing about, but
  // aren't app bugs.
  const level = (status && status < 500) || e?.code === 'auth/network-request-failed' ? 'warn' : 'error'
  reportClientEvent(level, 'app', `${context}: ${describeClientError(err)}`, { detail: detail || undefined })
}

/**
 * A failed sign-in step (login, registration, Google, password reset,
 * verification email...): Firebase's reason code (auth/invalid-credential,
 * auth/too-many-requests...), or the HTTP status if it was the app's own API
 * call after Firebase that failed. The typed-in email is included because a
 * failed sign-in has no token to identify the user by.
 */
export function reportAuthFailure(action: string, err: unknown, email?: string | null): void {
  console.error(action, err)
  const e = err as any
  const reason = e?.code ?? (e?.response?.status ? `HTTP ${e.response.status}` : describeClientError(err))
  const ref = errorRef(e)
  reportClientEvent('warn', 'auth', `${action} failed: ${reason}`, { email, detail: ref ? `server ref ${ref}` : undefined })
}
