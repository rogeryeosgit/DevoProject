var log4js = require('log4js');

export default function (req, res, next) {
    log4js.configure({
        appenders: { QTApp: { type: 'file', filename: 'QTApp.log' } },
        categories: { default: { appenders: ['QTApp'], level: 'ALL' } }
    });
    next()
}