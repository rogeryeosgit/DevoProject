const express = require('express');
const { Nuxt, Builder } = require('nuxt');
const log4js = require('log4js');
const app = express();
const https = require('https');
var db = require('./services/db-connector');
var authService = require('./services/auth');

// Import and Set Nuxt.js options
const config = require('../nuxt.config.js')
config.dev = process.env.NODE_ENV !== 'production'

async function start() {
  // Init Nuxt.js
  const nuxt = new Nuxt(config)

  const { host, port } = nuxt.options.server

  await nuxt.ready()
  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  }
  
  authService.init();
  
  // Give nuxt middleware to express
  app.use(nuxt.render)

  // Listen the server
  https.createServer(nuxt.options.server.https, app).listen(port, host);
  // app.listen(port, host);

  // Setting up logging for Express Server
  log4js.configure({
    appenders: { QTApp: { type: 'file', filename: 'QTApp.log' } },
    categories: { default: { appenders: ['QTApp'], level: 'ALL' } }
  });

  const logger = log4js.getLogger();
  logger.info(`Server listening on https://${host}:${port}`);

  db.init();
}
start()
