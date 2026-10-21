import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { logger } from '../utils/logger'

export default defineNitroPlugin(() => {
  if (getApps().length > 0) return

  const config = useRuntimeConfig()
  const serviceAccountPath = resolve(process.cwd(), config.firebaseServiceAccountPath)
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))

  initializeApp({ credential: cert(serviceAccount) })
  logger.info('firebase-admin: initialized')
})
