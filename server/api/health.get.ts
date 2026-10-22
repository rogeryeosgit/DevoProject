import mongoose from 'mongoose'
import { logger } from '../utils/logger'

const PING_TIMEOUT_MS = 3000

// Health check for deploy.yml (and any uptime monitor): 200 only when the
// app can actually reach MongoDB. `/` can't tell - it still returns 200 with
// the database down, because today's passage falls back to Proverbs.
// Public and cheap; never reveals connection details.
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'no-store')
  try {
    const db = mongoose.connection.db
    if (mongoose.connection.readyState !== 1 || !db) {
      throw new Error(`not connected (mongoose state ${mongoose.connection.readyState})`)
    }
    await Promise.race([
      db.command({ ping: 1 }),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`no ping reply within ${PING_TIMEOUT_MS}ms`)), PING_TIMEOUT_MS))
    ])
    return { status: 'ok', database: 'ok' }
  } catch (err) {
    logger.warn('HEALTH: database unreachable -', err)
    setResponseStatus(event, 503)
    return { status: 'error', database: 'unreachable' }
  }
})
