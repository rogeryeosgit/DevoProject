import { logger } from '../utils/logger'

// Process-level QTApp.log lines: what the old server/index.js logged at boot,
// plus a matching line on shutdown so restarts are visible in the file.
export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig()

  logger.info(`Server started (qtapp ${config.public.appVersion}, node ${process.version}, pid ${process.pid}, log level ${logger.level})`)

  nitroApp.hooks.hook('close', async () => {
    logger.info('Server stopping')
    await logger.close()
  })
})
