import { tryGetEmail } from '../utils/auth'
import { logger, logStats, safePath } from '../utils/logger'

// Receives problem reports from browsers (utils/reportClientError.ts) and
// writes them to QTApp.log as CLIENT: lines - errors that otherwise only
// ever showed up in the user's own browser console.
//
// Public on purpose (failed sign-ins happen before there's a token), so it's
// defensive: reports over 2 KB are refused, each IP gets REPORTS_PER_WINDOW
// per 5 minutes and everyone together GLOBAL_PER_WINDOW, and rejections
// answer with a bare status instead of throwing - a thrown error would
// write its own log line, defeating the limit.
const MAX_BODY_BYTES = 2048
const WINDOW_MS = 5 * 60 * 1000
const REPORTS_PER_WINDOW = 20
const GLOBAL_PER_WINDOW = 300
const LEVELS = ['info', 'warn', 'error'] as const

const perIp = new Map<string, { count: number; windowStart: number }>()
let globalWindow = { count: 0, windowStart: 0, warned: false }

function allow(ip: string, now: number): boolean {
  if (now - globalWindow.windowStart > WINDOW_MS) globalWindow = { count: 0, windowStart: now, warned: false }
  if (++globalWindow.count > GLOBAL_PER_WINDOW) {
    if (!globalWindow.warned) {
      globalWindow.warned = true
      logger.warn(`CLIENT: over ${GLOBAL_PER_WINDOW} reports in 5 minutes - dropping the rest of this window`)
    }
    return false
  }
  if (perIp.size > 5000) perIp.clear() // bounded memory; the global limit still holds
  const entry = perIp.get(ip)
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    perIp.set(ip, { count: 1, windowStart: now })
    return true
  }
  return ++entry.count <= REPORTS_PER_WINDOW
}

const clip = (value: unknown, max: number) =>
  typeof value === 'string' ? value.replace(/[\r\n]+/g, ' ').trim().slice(0, max) : undefined

export default defineEventHandler(async (event) => {
  if (Number(getHeader(event, 'content-length') ?? 0) > MAX_BODY_BYTES) {
    setResponseStatus(event, 413)
    return null
  }
  if (!allow(getRequestIP(event, { xForwardedFor: true }) ?? 'unknown', Date.now())) {
    setResponseStatus(event, 429)
    return null
  }
  const raw = await readRawBody(event)
  if (!raw || raw.length > MAX_BODY_BYTES) {
    setResponseStatus(event, raw ? 413 : 400)
    return null
  }
  let body: Record<string, unknown>
  try {
    body = JSON.parse(raw)
  } catch {
    setResponseStatus(event, 400)
    return null
  }

  const level = LEVELS.includes(body.level as any) ? (body.level as typeof LEVELS[number]) : 'error'
  const category = clip(body.category, 20)?.replace(/[^a-z-]/gi, '') || 'app'
  const message = clip(body.message, 300)
  if (!message) {
    setResponseStatus(event, 400)
    return null
  }
  // A signed-in user is identified from their token. Sign-in failures have
  // no token, so the auth category may name the email typed in - marked as
  // "claimed" since nothing proves it.
  const email = (await tryGetEmail(event))
    ?? (category === 'auth' && clip(body.email, 100) ? `${clip(body.email, 100)} (claimed)` : undefined)

  const parts = [`CLIENT: [${category}] ${message}`]
  const detail = clip(body.detail, 500)
  if (detail) parts.push(detail)
  parts.push(`page=${safePath(clip(body.path, 200) ?? '') || 'unknown'}`)
  if (email) parts.push(`user=${email}`)
  parts.push(`v=${clip(body.appVersion, 40) ?? '?'}`)
  parts.push(`ua=${clip(getHeader(event, 'user-agent'), 150) ?? '?'}`)

  logStats.clientReports++
  logger[level](parts.join(' | '))
  setResponseStatus(event, 204)
  return null
})
