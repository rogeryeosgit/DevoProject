var express = require('express');
var router = express.Router();
var log4js = require('log4js');
var logger = log4js.getLogger();
var BRService = require('../services/bible-retrieval');
var AuthService = require('../services/auth');

var p = '';

// GET route after registering
router.get('/passages/today', async function (req, res, next) {
  try {
    p = await BRService.getPassage('john+1');
  } catch (err) {
    return next(err);
  }
  return res.send(p);
});

router.post('/users', async function (req, res, next) {
  if (req.body.isLogin) {
    try {
      await AuthService.getUser(req.body.id, req.body.pwd, result = (data) => {
        return res.send(data);
      })
    } catch (err) {
      logger.error("SERVER ROUTER: Error after calling AuthService -> " + err);
      return next(err);
    }
  } else {
    try {
      await AuthService.createUser(req.body.id, req.body.pwd, result = (data) => {
        return res.send(data);
      })
    } catch (err) {
      logger.error("SERVER ROUTER: Error after calling AuthService -> " + err);
      return next(err);
    }
  };
});

module.exports = router;