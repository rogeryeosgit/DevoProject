// https://nuxt.com/docs/api/configuration/nuxt-config
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// Stamped at build time into the startup log line and every browser error
// report, so a log line can be matched to the deploy that produced it.
const appVersion = (() => {
  const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))
  try {
    return `${version}+${execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()}`
  } catch {
    return version
  }
})()

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  ssr: true,
  devtools: { enabled: true },
  telemetry: false,

  // The dev server reloads the browser when files in the project change. Its
  // own log (logs/QTApp.log) changes on every logged request - left watched,
  // an error page wrote a line, triggered a reload, failed again, and looped.
  ignore: ['logs/**'],

  app: {
    head: {
      title: 'Your QT App',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Your Personal QT App and Journaling App' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' }
      ]
    }
  },

  modules: [
    'vuetify-nuxt-module',
    '@pinia/nuxt',
    'nuxt-gtag'
  ],

  // Deliberately the only global stylesheet in the app (see the file itself for
  // why it exists at all) — everything else is Vuetify props/defaults/utility
  // classes. Keep it at zero-or-near-zero rules.
  css: ['~/assets/css/app.css'],

  // Theme is dark-mode-only (matches current production behavior — see FEATURES.md §8).
  // The light palette that existed in the Nuxt 2 config was dead code and is intentionally
  // not carried forward.
  vuetify: {
    vuetifyOptions: {
      // Vuetify 3 introduced "density" as a new concept with its own default spacing,
      // which reads visibly more spacious than Vuetify 2's fixed baseline ever was
      // (confirmed by the user across the login card, PRESS description, and the
      // PassagePicker chapter list all looking more spread out than production).
      // "comfortable" tightens padding on every density-aware component at once.
      defaults: {
        global: {
          density: 'comfortable'
        },
        // Buttons specifically read "too thin" to tap accurately at the global
        // "comfortable" density (28px tall) - opt VBtn back out to Vuetify's
        // baseline "default" density (36px tall) so buttons are a bit chunkier
        // and easier to hit, without loosening every other density-aware
        // component (text fields, list items, cards, etc. all stay
        // "comfortable" via the global default above).
        VBtn: {
          density: 'default'
        },
        // Vuetify ships these four with `white-space: nowrap; overflow: hidden;
        // text-overflow: ellipsis` (VCard.css, VListItem.css) — on narrow screens
        // that silently *truncates* content (a plan name, a passage reference)
        // instead of wrapping it, invisibly. A `class` set here is concatenated
        // with, not overridden by, any local class (see Vuetify's
        // composables/defaults.js), so this is purely additive and doesn't
        // clobber existing per-component classes.
        // NB: deliberately NOT touching VLabel here — it backs every text
        // field's floating label, and wrapping it breaks that transform app-wide.
        VCardTitle: {
          class: 'text-wrap'
        },
        VCardSubtitle: {
          class: 'text-wrap'
        },
        VListItemTitle: {
          class: 'text-wrap'
        },
        VListItemSubtitle: {
          class: 'text-wrap'
        }
      },
      theme: {
        defaultTheme: 'qtDark',
        themes: {
          qtDark: {
            dark: true,
            colors: {
              primary: '#64B5F6', // blue.lighten2
              secondary: '#FFE082', // amber.lighten3
              accent: '#E0E0E0', // grey.lighten3
              info: '#4DB6AC', // teal.lighten1
              warning: '#FFC107', // amber.base
              error: '#FF3D00', // deepOrange.accent4
              success: '#00E676', // green.accent3
              // Vuetify 3 auto-computes on-<color> text/icon color via a contrast
              // calculation unless overridden - for some of these (bright success green,
              // light amber secondary) that computes to black text. Vuetify 2 always used
              // white text on colored buttons regardless of contrast math; force that back.
              'on-primary': '#FFFFFF',
              'on-secondary': '#FFFFFF',
              'on-accent': '#FFFFFF',
              'on-info': '#FFFFFF',
              'on-warning': '#FFFFFF',
              'on-error': '#FFFFFF',
              'on-success': '#FFFFFF'
            }
          }
        }
      }
    }
  },

  gtag: {
    id: 'G-TDZSY166ND'
  },

  // Short-lived cache in front of /api/passages/today: absorbs bursts of
  // concurrent home-page loads without repeating the Mongo plan lookup (the
  // ESV text itself is already cached separately for 1hr via
  // defineCachedFunction - see server/utils/bible-retrieval.ts).
  // Deliberately swr: false, NOT stale-while-revalidate: `swr: true` returns
  // the *expired* cached entry immediately and revalidates in the background,
  // which handed a client-side day-rollover refetch (pages/index.vue) the
  // previous day's cached passage right at the moment it most needed a fresh
  // one. maxAge: 60 alone still awaits a fresh resolve once the entry
  // expires, so the burst-absorption stays but an expired entry can no
  // longer be served stale.
  routeRules: {
    '/api/passages/today': { cache: { maxAge: 60, swr: false } }
  },

  // Server-only secrets are intentionally NOT read from process.env here — this file is
  // evaluated once at build time, so a bare `process.env.X` default gets baked into the
  // compiled .output and silently ignored thereafter. These must be supplied purely via
  // Nitro's automatic NUXT_-prefixed runtime env var overrides (NUXT_MONGODB_ACCESS,
  // NUXT_MONGOOSE_SECRET, NUXT_ESV_API_KEY, NUXT_CACHE_TTL,
  // NUXT_FIREBASE_SERVICE_ACCOUNT_PATH), read fresh every time the compiled server boots -
  // in dev, in the test deployment, and in production alike.
  runtimeConfig: {
    mongodbAccess: '',
    mongooseSecret: '',
    esvApiKey: '',
    cacheTtl: '3600',
    firebaseServiceAccountPath: 'fb-service-account.json',

    // QTApp.log (server/utils/logger.ts). Override with NUXT_LOG_DIR,
    // NUXT_LOG_LEVEL, NUXT_LOG_RETENTION_DAYS, NUXT_LOG_MAX_FILE_MB,
    // NUXT_LOG_MAX_TOTAL_MB. logDir is relative to the app's working directory
    // (the repo root in dev, /QTNuxtProject under PM2) unless absolute.
    logDir: 'logs',
    logLevel: 'info',
    logRetentionDays: '365',
    logMaxFileMb: '200',
    logMaxTotalMb: '5120',

    // Public (exposed to the client — safe, matches today's inline Firebase client config)
    public: {
      appVersion,
      firebase: {
        apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyAOYahacsrT-2O_T__716n1Kw6fX9X3Zzk',
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'qtapp-3b06e.firebaseapp.com',
        projectId: process.env.FIREBASE_PROJECT_ID || 'qtapp-3b06e',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'qtapp-3b06e.appspot.com',
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '614414854141',
        appId: process.env.FIREBASE_APP_ID || '1:614414854141:web:fa63f8d748856cea151b94'
      }
    }
  },

  nitro: {
    // Same-origin API: pages call relative /api/... paths, no browserBaseURL/baseURL split
    // (see FEATURES.md §9 — the dual-base-URL config and dev TLS bypass both go away).
    experimental: {
      // Lets server/utils/logger.ts find the current request (and its error
      // reference code) via useEvent() without every call site passing it in.
      asyncContext: true
    }
  },

  typescript: {
    strict: true,
    typeCheck: false // enable in CI once the initial port settles
  }
})
