var express = require('express');
var router = express.Router();
var log4js = require('log4js');
var logger = log4js.getLogger();
var BRService = require('../services/bible-retrieval');
var AuthService = require('../services/auth');
var Plan = require('../services/models/Plan');

var p = '';

// GET route after registering
router.get('/passages/today', async function (req, res, next) {
  try {
    p = await BRService.getPassage('john 15:1-15:12');
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

router.post('/plans', async function (req, res, next) {
  try {
    const newPlan = new Plan({
      creatorEmail: "test@test.com",
      planName: "default",
      description: "This is a default test plan",
      passages: {
        'Jan2019': {
          '1': 'gen',
          '2': 'ex',
          '3': 'deu',
          '4': 'john',
          '5': 'mark'
        },
        'Mar2020': {
          '1': 'gen2',
          '2': 'ex2',
          '3': 'deu2',
          '4': 'john2',
          '5': 'mark2'
        }
      }
    });
    newPlan.save();
  }
  catch (err) {
    logger.error("SERVER ROUTER: plans --> " + err);
  }
});

module.exports = router;