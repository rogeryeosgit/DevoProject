var express = require('express');
var router = express.Router();
var log4js = require('log4js');
var logger = log4js.getLogger();
var BRService = require('../services/bible-retrieval');
var AuthService = require('../services/auth');

var p = '';
var token = '';

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
    result = await AuthService.authenticateUser(req.body.id, req.body.pwd, req.body.isLogin);
    logger.debug("SERVER ROUTER: Token that needs to be returned -> " + result);
    token = result;
  } catch (err) {
    logger.error("SERVER ROUTER: Error after calling AuthService" + err);
    return next(err);
  }
  return res.send(token);
});

module.exports = router;