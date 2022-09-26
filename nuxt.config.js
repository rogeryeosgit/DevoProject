const colors = require('vuetify/es5/util/colors').default
const bodyParser = require('body-parser');

module.exports = {
  mode: 'universal',
  /*
  ** Headers of the page
  */
  head: {
    title: 'Your QT App',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: process.env.npm_package_description || '' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.png' }
    ]
  },
  /*
  ** Prevent telemetry aquisition from nuxt
  */
  telemetry: false,
  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#fff' },
  /*
  ** Global CSS
  */
  css: [
  ],
  /*
  ** Plugins to load before mounting the App
  */
  plugins: [
    '@/plugins/gtag',
    '~plugins/date-filter.js',
    '@/plugins/axios'
  ],
  /*
  ** Nuxt.js dev-modules
  */
  buildModules: [
    '@nuxtjs/vuetify'
  ],
  /*
  ** Nuxt.js modules
  */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    '@nuxtjs/firebase'
  ],
  server: {
  },
  /*
  ** Serverside middleware
  */
  serverMiddleware: [
    bodyParser.json(),
    '~/server/routes/router'
  ],
  /*
  ** Axios module configuration
  ** See https://axios.nuxtjs.org/options
  */
  axios: {
    browserBaseURL: process.env.BROWSER_BASE_URL || 'https://qt.navigators.tech',
    baseURL: process.env.BASE_URL || 'https://127.0.0.1:3000',
    credentials: false,
    https: true
  },
  /*
  ** vuetify module configuration
  ** https://github.com/nuxt-community/vuetify-module
  */
  vuetify: {
    theme: {
      dark: false,
      themes: {
        light: {
          primary: colors.blue.lighten2,
          accent: colors.grey.lighten3,
          secondary: colors.amber.lighten3,
          info: colors.teal.lighten1,
          warning: colors.amber.base,
          error: colors.deepOrange.accent4,
          success: colors.green.accent3
        }
      }
    }
  },
  // publicRuntimeConfig: {
  //   googleAnalytics: {
  //     id: process.env.GA_ID
  //   }
  // },
  firebase: {
    config: {
      apiKey: 'AIzaSyAOYahacsrT-2O_T__716n1Kw6fX9X3Zzk',
      authDomain: 'qtapp-3b06e.firebaseapp.com',
      databaseURL: 'https://qtapp-3b06e.firebaseio.com',
      projectId: 'qtapp-3b06e',
      storageBucket: 'qtapp-3b06e.appspot.com',
      messagingSenderId: '614414854141',
      appId: '1:614414854141:web:fa63f8d748856cea151b94'
    },
    services: {
      auth: true
    }
  },
  /*
  ** Build configuration
  */
  build: {
    /*
    ** You can extend webpack config here
    */
    extend(config, ctx) {
    }
  }
}
