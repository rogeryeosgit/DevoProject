var express = require('express');
var router = express.Router();
var log4js = require('log4js');
var logger = log4js.getLogger();
var BRService = require('../services/bible-retrieval');
var AuthService = require('../services/auth');

var p = '';

// GET route after registering
router.get('/getTodaysPassage', async function (req, res, next) {
  try {
    p = await BRService.getPassage('john+1');
  } catch (err) {
    return next(err);
  }
  return res.send(p);
});

router.post('/getAuthenticated', async function (req, res, next) {
  try {
    await AuthService.authenticateUser(req.body.id, req.body.pwd, req.body.isLogin, result = (data) => {
      logger.debug("SERVER ROUTER: data returned -> " + data.idToken + " " + data.exTime);
      return res.send(data);
    })
  } catch (err) {
    logger.error("SERVER ROUTER: Error after calling AuthService -> " + err);
    return next(err);
  }
});

module.exports = router;