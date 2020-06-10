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

  Plan.findOne({ planName: "--- Default Nav Plan ---" }, async (err, returnedPlan) => {
    if (err) {
      logger.error("SERVER ROUTER: Error after looking up DB for default Plan : " + err);
      return next(err);
    } else {
      try {
        var month = new Date().toUTCString().substr(8, 8);
        var day = new Date().getDate();
        p = await BRService.getPassage(returnedPlan.passages.get(month).get(day.toString()));
      } catch (err) {
        logger.error("SERVER ROUTER: Error after trying to access ESV API during default : " + err);
        return next(err);
      }
      return res.send(p);
    }
  });
});

router.post('/users', async function (req, res, next) {
  if (req.body.isLogin) {
    try {
      await AuthService.getUser(req.body.id, req.body.pwd, result = (data) => {
        return res.send(data);
      })
    } catch (err) {
      logger.error("SERVER ROUTER: Error after calling AuthService -> " + err);
      res.status(500).send("Authentication Failed");
      return next(err);
    }
  } else {
    try {
      await AuthService.createUser(req.body.id, req.body.pwd, result = (data) => {
        return res.send(data);
      })
    } catch (err) {
      logger.error("SERVER ROUTER: Error after calling AuthService -> " + err);
      res.status(500).send("Unable to register new user");
      return next(err);
    }
  };
});

router.post('/plans', async function (req, res, next) {
  try {
    const newPlan = new Plan({
      creatorEmail: req.body.creatorEmail,
      planName: req.body.planName,
      description: req.body.description,
      passages: req.body.passages
    });
    newPlan.save();
  }
  catch (err) {
    logger.error("SERVER ROUTER: plans --> " + err);
  }
});

module.exports = router;