import mongoose from 'mongoose'
import { logger } from '../utils/logger'

// How long a database call waits for MongoDB to become reachable before it
// fails. The driver's default is 30s - during an outage people stared at a
// frozen page for half a minute. 5s still rides out a typical Atlas primary
// switchover.
const SERVER_SELECTION_TIMEOUT_MS = 5000
// Retry gaps for a failed first connect: 5s, 10s, 20s ... capped at 60s.
const INITIAL_RETRY_MS = 5000
const MAX_RETRY_MS = 60_000

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig()

  mongoose.connection.on('error', (err) => {
    logger.error('DB Connector: Connection Error', err)
  })
  let everConnected = false
  mongoose.connection.once('open', () => {
    everConnected = true
    logger.info('DB Connector: *--- Connected to Data Store ---*')
  })

  // Mid-run connection drops (Atlas maintenance, network blips). The driver
  // retries on its own; these show how long the app was without a database.
  // (Failed *first* connects also emit 'disconnected' - those are reported,
  // and retried, by connect() below instead.)
  let shuttingDown = false
  mongoose.connection.on('disconnected', () => {
    if (!shuttingDown && everConnected) logger.warn('DB Connector: disconnected from Data Store, driver will retry')
  })
  mongoose.connection.on('reconnected', () => {
    logger.info('DB Connector: reconnected to Data Store')
  })

  // A failed *first* connect rejects this promise rather than emitting
  // 'error' - unawaited, it only ever surfaced as an anonymous
  // unhandledRejection. The driver never retries a failed first connect
  // (only drops after a successful one), so retry here with a growing gap -
  // e.g. PM2 starting the app at boot before the network or Atlas is up.
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let retryDelayMs = INITIAL_RETRY_MS
  const connect = () => {
    mongoose.connect(config.mongodbAccess, { serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS }).catch((err) => {
      if (shuttingDown) return
      logger.error(`DB Connector: initial connection failed, retrying in ${retryDelayMs / 1000}s -`, err)
      retryTimer = setTimeout(connect, retryDelayMs)
      retryTimer.unref()
      retryDelayMs = Math.min(retryDelayMs * 2, MAX_RETRY_MS)
    })
  }
  connect()

  // Closed from Nitro's own graceful shutdown (SIGTERM/SIGINT - PM2 stop or
  // restart, Ctrl-C in dev) instead of a separate SIGINT handler that called
  // process.exit(0) and could cut the rest of that shutdown short.
  nitroApp.hooks.hook('close', async () => {
    shuttingDown = true
    clearTimeout(retryTimer)
    await mongoose.connection.close()
    logger.info('DB Connector: Mongoose default connection is disconnected due to node termination')
  })
})
