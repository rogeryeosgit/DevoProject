import type { H3Error, H3Event } from 'h3'
import { logger, logStats, msUntilNextSgtMidnight, resetLogStats, safePath } from '../utils/logger'

const SLOW_REQUEST_MS = 1000

// Reference codes users can quote ("Error ref: K7Q2XA"): 6 characters from an
// alphabet without look-alikes (0/O, 1/I/L), unique enough to grep a year of logs.
const REF_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
const newRef = () => Array.from({ length: 6 }, () => REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)]).join('')
const DAY_MS = 24 * 60 * 60 * 1000

// Dev-only asset/HMR traffic - not app requests, so not timed or counted.
const isInternalPath = (path: string) => path.startsWith('/_nuxt/') || path.startsWith('/__nuxt') || path.startsWith('/@')

// mongoose-field-encryption fails with OpenSSL's messages when a journal
// field can't be decrypted (wrong or rotated NUXT_MONGOOSE_SECRET).
const isDecryptionError = (message: string) => /bad decrypt|wrong final block length/i.test(message)

// Process-level QTApp.log lines: startup/shutdown (what the old
// server/index.js logged), every request error in one place (replacing the
// old router's per-route "Error in ..." lines), slow requests, crashes, and a
// daily summary.
export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig()
  const startedAt = Date.now()

  logger.info(`Server started (qtapp ${config.public.appVersion}, node ${process.version}, pid ${process.pid}, log level ${logger.level})`)

  // Every request gets a reference code; the logger prefixes each line logged
  // while handling it (server/utils/logger.ts), and failed responses carry it
  // in the x-error-ref header for the client to show (useAuthFetch.ts).
  nitroApp.hooks.hook('request', (event: H3Event) => {
    event.context.ref = newRef()
    event.context.startedAt = performance.now()
  })

  const elapsedMs = (event: H3Event) => Math.round(performance.now() - (event.context.startedAt ?? performance.now()))

  // Successful responses only - Nitro doesn't run afterResponse for errors,
  // which are counted (and timed) in the error hook below instead.
  nitroApp.hooks.hook('afterResponse', (event: H3Event) => {
    const path = event.path
    if (isInternalPath(path) || event.context.loggedAsError) return
    logStats.requests++
    const status = getResponseStatus(event)
    if (status >= 500) logStats.status5xx++
    else if (status >= 400) logStats.status4xx++

    const ms = elapsedMs(event)
    if (ms > SLOW_REQUEST_MS) {
      logStats.slowRequests++
      logger.forRef(event.context.ref).warn(`SLOW ${event.method} ${safePath(path)} ${ms}ms (status ${status})`)
    }
  })

  nitroApp.hooks.hook('error', (error, { event, tags }) => {
    // Outside a request: crashes Nitro trapped instead of letting the process
    // die (PM2 would otherwise restart it with no trace in QTApp.log), plus
    // plugin and cache-storage failures.
    if (!event) {
      if (tags?.includes('unhandledRejection') || tags?.includes('uncaughtException')) {
        logger.fatal(`PROCESS: ${tags.join(', ')} -`, error)
      } else {
        logger.error(`SERVER: ${tags?.join(', ') || 'background'} error -`, error)
      }
      return
    }

    const err = error as H3Error
    const status = err.statusCode ?? 500
    const path = safePath(event.path)
    event.context.loggedAsError = true
    // A header, not error.data: Nuxt and Nitro strip `data` from responses for
    // unexpected (unhandled) errors - exactly the ones worth a reference code.
    if (event.context.ref) setResponseHeader(event, 'x-error-ref', event.context.ref)
    logStats.requests++

    // Scanners probing /wp-admin, /.env etc. hit unknown *pages*; those only
    // count toward the daily summary. Unknown /api routes are still logged.
    if (status === 404 && !path.startsWith('/api/')) {
      logStats.ignored404++
      return
    }
    if (status >= 500) logStats.status5xx++
    else logStats.status4xx++

    const log = logger.forRef(event.context.ref)
    const cause = err.cause instanceof Error ? err.cause : undefined
    const reason = cause ? `${cause.name}: ${cause.message}` : (err.statusMessage || err.message)
    const prefix = isDecryptionError(reason) ? 'DECRYPTION: ' : ''
    const ms = elapsedMs(event)
    const timing = ms > SLOW_REQUEST_MS ? ` (${ms}ms)` : ''
    const line = `${prefix}SERVER ROUTER: ${event.method} ${path} -> ${status} ${reason}${timing}`
    if (status >= 500) {
      log.error(line)
      // The stack only at debug level - it's long and rarely needed.
      if (logger.level === 'debug' && cause?.stack) log.debug(cause.stack)
    } else {
      // Input validation (zod, once added) reports which fields failed - names
      // only, never the submitted values.
      const issues = (err.data as { issues?: { path?: (string | number)[] }[] } | undefined)?.issues
      const fields = issues?.map(i => i.path?.join('.')).filter(Boolean)
      log.warn(fields?.length ? `${line} (fields: ${fields.join(', ')})` : line)
    }
  })

  // Daily summary at 00:00 SGT, so trends (error spikes, ESV usage, memory
  // creep) are visible without reading every line.
  const writeSummary = () => {
    const mem = process.memoryUsage()
    const uptimeHours = ((Date.now() - startedAt) / 3_600_000).toFixed(1)
    logger.info(
      `SUMMARY (since last summary or start): requests ${logStats.requests}, 4xx ${logStats.status4xx}, 5xx ${logStats.status5xx}, `
      + `slow ${logStats.slowRequests}, ignored page 404s ${logStats.ignored404}, ESV calls ${logStats.esvCalls}, `
      + `ESV cache hits ${logStats.esvCacheHits}, client reports ${logStats.clientReports} | `
      + `uptime ${uptimeHours}h, memory rss ${Math.round(mem.rss / 1_048_576)} MB, heap ${Math.round(mem.heapUsed / 1_048_576)} MB`
    )
    resetLogStats()
  }
  let interval: ReturnType<typeof setInterval> | undefined
  const firstSummary = setTimeout(() => {
    writeSummary()
    interval = setInterval(writeSummary, DAY_MS)
    interval.unref()
  }, msUntilNextSgtMidnight(Date.now()))
  firstSummary.unref()

  nitroApp.hooks.hook('close', async () => {
    clearTimeout(firstSummary)
    if (interval) clearInterval(interval)
    logger.info('Server stopping')
    await logger.close()
  })
})
