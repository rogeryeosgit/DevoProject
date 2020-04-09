var log4js = require('log4js');

log4js.configure({
    appenders: { QTApp: { type: 'file', filename: 'QTApp.log' } },
    categories: { default: { appenders: ['QTApp'], level: 'DEBUG' } }
});

var logger = log4js.getLogger('QTApp');

module.exports = logger;


