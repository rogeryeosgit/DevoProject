import mongoose from 'mongoose'
import { logger } from '../utils/logger'

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig()

  mongoose.connection.on('error', (err) => {
    logger.error('DB Connector: Connection Error', err)
  })
  mongoose.connection.once('open', () => {
    logger.info('DB Connector: *--- Connected to Data Store ---*')
  })

  // A failed *first* connect rejects this promise rather than emitting
  // 'error' - unawaited, it only ever surfaced as an anonymous
  // unhandledRejection.
  mongoose.connect(config.mongodbAccess).catch((err) => {
    logger.error('DB Connector: initial connection failed', err)
  })

  // Closed from Nitro's own graceful shutdown (SIGTERM/SIGINT - PM2 stop or
  // restart, Ctrl-C in dev) instead of a separate SIGINT handler that called
  // process.exit(0) and could cut the rest of that shutdown short.
  nitroApp.hooks.hook('close', async () => {
    await mongoose.connection.close()
    logger.info('DB Connector: Mongoose default connection is disconnected due to node termination')
  })
})
