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
    console.error('bible-retrieval: ESV API error', err)
    throw err
  }
}, {
  maxAge: Number(runtimeConfig.cacheTtl) || 3600,
  name: 'bible-passage',
  getKey: (passage: string) => passage
})
