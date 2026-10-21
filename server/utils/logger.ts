import { appendFileSync, createWriteStream, existsSync, mkdirSync, openSync, readdirSync, renameSync, statSync, unlinkSync, type WriteStream } from 'node:fs'
import { join, resolve } from 'node:path'

// Brings back the QTApp.log file the Nuxt 2/Express app used to write via
// log4js (retired in the Nitro rewrite, 8fdaf81). Lines keep log4js's default
// file layout so old habits (`grep ERROR QTApp.log`) still work:
//
//   [2026-10-21T14:03:12.345+08:00] [ERROR] default - [K7Q2XA] SERVER ROUTER: ...
//
// Differences from the old setup, all deliberate:
// - Every timestamp is Singapore time (+08:00) regardless of the server's own
//   TZ. Singapore has no DST, so a fixed offset is always correct.
// - One file per week (Mon 00:00 - Sun 23:59 SGT). QTApp.log is the current
//   week; past weeks are renamed QTApp.<Monday's date>.log and kept for
//   logRetentionDays (365) - subject to the size caps below, so a runaway bug
//   or bot can't fill the disk.
// - Lines also go to the console, so `npm run dev` output and PM2's own logs
//   keep working exactly as before.
// - Single-writer by design: production runs PM2 fork mode with one instance.
//   Cluster mode would need one file per process.

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'
const LEVEL_RANK: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40, fatal: 50 }

const SGT_OFFSET_MS = 8 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const MB = 1024 * 1024
const CURRENT_FILE = 'QTApp.log'
const ROTATED_FILE = /^QTApp\.(\d{4})-(\d{2})-(\d{2})(?:\.(\d+))?\.log$/

const pad = (n: number, width = 2) => String(n).padStart(width, '0')

// Shift into SGT, then read with the UTC getters - those return Singapore's
// wall-clock fields no matter what TZ the process itself runs under.
function sgtDate(ms: number): Date {
  return new Date(ms + SGT_OFFSET_MS)
}

function sgtDateKey(ms: number): string {
  const d = sgtDate(ms)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export function formatSgt(ms: number): string {
  const d = sgtDate(ms)
  return `${sgtDateKey(ms)}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad(d.getUTCMilliseconds(), 3)}+08:00`
}

/** Epoch ms of the Monday 00:00 SGT that starts the week containing `ms`. */
export function sgtWeekStart(ms: number): number {
  const d = sgtDate(ms)
  const daysSinceMonday = (d.getUTCDay() + 6) % 7
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - daysSinceMonday) - SGT_OFFSET_MS
}

/** Milliseconds from `ms` until the next 00:00 SGT. */
export function msUntilNextSgtMidnight(ms: number): number {
  const d = sgtDate(ms)
  const nextMidnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - SGT_OFFSET_MS
  return nextMidnight - ms
}

function describe(arg: unknown, withStack: boolean): string {
  if (arg instanceof Error) {
    const head = `${arg.name}: ${arg.message}`
    return withStack && arg.stack ? `${head}\n${arg.stack}` : head
  }
  if (typeof arg === 'string') return arg
  try {
    const json = JSON.stringify(arg)
    return json.length > 500 ? `${json.slice(0, 500)}…` : json
  } catch {
    return String(arg)
  }
}

export interface FileLoggerOptions {
  dir: string
  level: LogLevel
  retentionDays: number
  maxFileBytes: number
  maxTotalBytes: number
  /** Request reference code to prefix lines with, if a request is in flight. */
  context?: () => string | undefined
  /** Injectable clock, so week rotation/retention can be tested without touching the system clock. */
  now?: () => number
  console?: boolean
}

export class FileLogger {
  private stream: WriteStream | null = null
  private currentWeek = 0
  private fileBytes = 0
  private capNoticeWritten = false
  private disabled = false
  private closed = false
  private readonly now: () => number

  constructor(private readonly opts: FileLoggerOptions) {
    this.now = opts.now ?? Date.now
    this.open()
  }

  get level(): LogLevel {
    return this.opts.level
  }

  log(level: LogLevel, args: unknown[]): void {
    if (LEVEL_RANK[level] < LEVEL_RANK[this.opts.level]) return
    const now = this.now()
    const withStack = level === 'fatal' || this.opts.level === 'debug'
    const ref = this.opts.context?.()
    const message = args.map(a => describe(a, withStack)).join(' ')
    const line = `[${formatSgt(now)}] [${level.toUpperCase()}] default - ${ref ? `[${ref}] ` : ''}${message}`

    if (this.opts.console !== false) {
      if (level === 'debug' || level === 'info') console.log(line)
      else if (level === 'warn') console.warn(line)
      else console.error(line)
    }
    this.writeLine(line, level, now)
  }

  // Flushes the stream and switches to synchronous appends: shutdown hooks
  // that run after this one (e.g. mongo's disconnect line) still reach the file.
  close(): Promise<void> {
    const stream = this.stream
    this.stream = null
    this.closed = true
    if (!stream) return Promise.resolve()
    return new Promise(done => stream.end(done))
  }

  private file(name: string): string {
    return join(this.opts.dir, name)
  }

  private writeLine(line: string, level: LogLevel, now: number): void {
    if (this.disabled) return
    if (this.closed) {
      try {
        appendFileSync(this.file(CURRENT_FILE), `${line}\n`)
      } catch {}
      return
    }
    if (sgtWeekStart(now) !== this.currentWeek) this.rotate(now)
    if (!this.stream) return

    if (this.fileBytes >= this.opts.maxFileBytes && LEVEL_RANK[level] < LEVEL_RANK.warn) {
      if (this.capNoticeWritten) return
      this.capNoticeWritten = true
      line = `[${formatSgt(now)}] [WARN] default - LOG: ${CURRENT_FILE} reached its ${Math.round(this.opts.maxFileBytes / MB)} MB cap for this week; only WARN and above will be written until the next weekly rotation`
    }
    this.stream.write(`${line}\n`)
    this.fileBytes += Buffer.byteLength(line) + 1
  }

  private open(): void {
    try {
      mkdirSync(this.opts.dir, { recursive: true })
      const now = this.now()
      const current = this.file(CURRENT_FILE)
      // A QTApp.log left over from an earlier week (e.g. the server was down
      // over a Monday) gets filed under its own week before writing resumes.
      if (existsSync(current)) {
        const lastWritten = statSync(current).mtimeMs
        if (sgtWeekStart(lastWritten) < sgtWeekStart(now)) this.archiveCurrent(sgtWeekStart(lastWritten))
      }
      this.openStream(now)
      this.prune(now)
    } catch (err) {
      this.disable(err)
    }
  }

  private openStream(now: number): void {
    const current = this.file(CURRENT_FILE)
    this.currentWeek = sgtWeekStart(now)
    this.fileBytes = existsSync(current) ? statSync(current).size : 0
    this.capNoticeWritten = false
    // Opened synchronously (createWriteStream's own open is async), so the file
    // exists on disk immediately - otherwise a rotation right after boot could
    // find nothing to rename and leave two streams appending to one file.
    this.stream = createWriteStream('', { fd: openSync(current, 'a') })
    this.stream.on('error', err => this.disable(err))
  }

  private rotate(now: number): void {
    try {
      // Renaming while the old stream is still flushing is fine on POSIX: its
      // descriptor keeps pointing at the renamed file.
      this.stream?.end()
      this.stream = null
      this.archiveCurrent(this.currentWeek)
      this.openStream(now)
      this.prune(now)
    } catch (err) {
      this.disable(err)
    }
  }

  private archiveCurrent(weekStart: number): void {
    const current = this.file(CURRENT_FILE)
    if (!existsSync(current)) return
    const base = `QTApp.${sgtDateKey(weekStart)}`
    let target = this.file(`${base}.log`)
    for (let n = 1; existsSync(target); n++) target = this.file(`${base}.${n}.log`)
    renameSync(current, target)
  }

  // Drops weekly files whose week ended more than retentionDays ago, then, if
  // the whole folder is still over maxTotalBytes, the oldest weeks first.
  private prune(now: number): void {
    const notes: string[] = []
    const rotated = readdirSync(this.opts.dir)
      .map((name) => {
        const m = ROTATED_FILE.exec(name)
        if (!m) return null
        const weekStart = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) - SGT_OFFSET_MS
        return { name, weekStart, suffix: Number(m[4] ?? 0), size: statSync(this.file(name)).size }
      })
      .filter((f): f is NonNullable<typeof f> => f !== null)
      .sort((a, b) => a.weekStart - b.weekStart || a.suffix - b.suffix)

    const retentionMs = this.opts.retentionDays * DAY_MS
    const kept = rotated.filter((f) => {
      if (now - (f.weekStart + 7 * DAY_MS) <= retentionMs) return true
      unlinkSync(this.file(f.name))
      notes.push(`LOG: removed ${f.name} (older than ${this.opts.retentionDays} days)`)
      return false
    })

    let total = this.fileBytes + kept.reduce((sum, f) => sum + f.size, 0)
    while (total > this.opts.maxTotalBytes && kept.length > 0) {
      const oldest = kept.shift()!
      unlinkSync(this.file(oldest.name))
      total -= oldest.size
      notes.push(`LOG: removed ${oldest.name} early - log folder exceeded its ${Math.round(this.opts.maxTotalBytes / MB)} MB cap`)
    }

    for (const note of notes) this.log(note.includes('early') ? 'warn' : 'info', [note])
  }

  private disable(err: unknown): void {
    if (this.disabled) return
    this.disabled = true
    this.stream = null
    console.warn(`[logger] ${CURRENT_FILE} disabled, logging to console only: ${describe(err, false)}`)
  }
}

// Counters for the daily summary line (server/plugins/logging.ts), reset after
// each summary. esvAccessCount is the old BRService lifetime counter.
export const logStats = {
  requests: 0,
  status4xx: 0,
  status5xx: 0,
  ignored404: 0,
  slowRequests: 0,
  esvCalls: 0,
  esvCacheHits: 0,
  clientReports: 0
}
export let esvAccessCount = 0
export function nextEsvAccessCount(): number {
  return ++esvAccessCount
}
export function resetLogStats(): void {
  for (const key of Object.keys(logStats) as (keyof typeof logStats)[]) logStats[key] = 0
}

function parseLevel(value: unknown): LogLevel {
  return typeof value === 'string' && value in LEVEL_RANK ? (value as LogLevel) : 'info'
}

let instance: FileLogger | undefined

function getInstance(): FileLogger {
  if (!instance) {
    const config = useRuntimeConfig()
    instance = new FileLogger({
      dir: resolve(process.cwd(), String(config.logDir || 'logs')),
      level: parseLevel(config.logLevel),
      retentionDays: Number(config.logRetentionDays) || 365,
      maxFileBytes: (Number(config.logMaxFileMb) || 200) * MB,
      maxTotalBytes: (Number(config.logMaxTotalMb) || 5120) * MB,
      // The request's reference code (set by server/plugins/logging.ts), via
      // Nitro's async context. Outside a request there's no event - no prefix.
      context: () => {
        try {
          return useEvent()?.context?.ref as string | undefined
        } catch {
          return undefined
        }
      }
    })
  }
  return instance
}

export const logger = {
  debug: (...args: unknown[]) => getInstance().log('debug', args),
  info: (...args: unknown[]) => getInstance().log('info', args),
  warn: (...args: unknown[]) => getInstance().log('warn', args),
  error: (...args: unknown[]) => getInstance().log('error', args),
  fatal: (...args: unknown[]) => getInstance().log('fatal', args),
  get level(): LogLevel {
    return getInstance().level
  },
  close: (): Promise<void> => instance?.close() ?? Promise.resolve()
}
