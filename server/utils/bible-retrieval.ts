import { logger, logStats, nextEsvAccessCount } from './logger'

const ESV_URL = 'https://api.esv.org/v3/passage/text/'

// The ESV passage/text response (only `passages` is rendered; the rest is
// passed through to the client as-is). Spelled out as $fetch's type argument
// because inferring it makes Nitro's typed $fetch compare the URL against
// every internal API route, which overflows tsc (TS2321) since Nuxt 4.6.
type EsvPassageResponse = Record<string, unknown> & { passages?: string[] }

const runtimeConfig = useRuntimeConfig()

// Replaces node-cache with Nitro's built-in cached-function helper (backed by
// unstorage) - same TTL-based caching, no extra dependency.
export const getPassage = defineCachedFunction(async (passage: string) => {
  // Only runs on a cache miss - each run is a real ESV API call (the API is
  // rate-limited, hence the lifetime counter the old BRService logged).
  logStats.esvCalls++
  logger.info(`BRService : ESVAPI Access Count : ${nextEsvAccessCount()} (${passage})`)
  try {
    return await $fetch<EsvPassageResponse>(ESV_URL, {
      headers: { Authorization: `Token ${runtimeConfig.esvApiKey}` },
      params: {
        q: passage,
        'include-passage-references': false,
        'include-footnotes': false,
        'include-headings': false
      }
    })
  } catch (err) {
    logger.error(`BRService Error : ${passage} -`, err)
    throw err
  }
}, {
  maxAge: Number(runtimeConfig.cacheTtl) || 3600,
  name: 'bible-passage',
  getKey: (passage: string) => passage,
  // Runs on every call, hit or miss. A fresh fetch has just stamped mtime; an
  // older one means the cached copy served this call.
  transform: (entry, passage: string) => {
    if (Date.now() - (entry.mtime ?? 0) > 1000) {
      logStats.esvCacheHits++
      logger.debug(`BRService : ${passage} found in cache`)
    }
    return entry.value
  }
})
