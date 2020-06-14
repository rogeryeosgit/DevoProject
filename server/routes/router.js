var express = require('express');
var router = express.Router();
var log4js = require('log4js');
var logger = log4js.getLogger();
var BRService = require('../services/bible-retrieval');
var AuthService = require('../services/auth');
var PlanModel = require('../services/models/Plan');
var UserModel = require('../services/models/User');

var p = '';
var defaultPlanName = "--- Default Nav Plan ---";

// GET route after registering
router.get('/passages/today', async function (req, res, next) {

  PlanModel.findOne({ planName: defaultPlanName }, async (err, returnedPlan) => {
    if (err) {
      logger.error("SERVER ROUTER: Error after looking up DB for default Plan : " + err);
      p = await BRService.getPassage(getDefaultPassage());
      return res.send(p);
    } else {
      try {
        var month = new Date().toUTCString().substr(8, 8);
        var day = new Date().getDate();
        p = await BRService.getPassage(returnedPlan.passages.get(month).get(day.toString()));
        return res.send(p);
      } catch (err) {
        logger.error("SERVER ROUTER: Error after trying to access ESV API during default : " + err);
        p = await BRService.getPassage(getDefaultPassage());
        return res.send(p);
      }
    }
  });
});

router.post('/users', async function (req, res, next) {
  if (req.body.isLogin) {
    try {
      await AuthService.getUser(req.body.id, req.body.pwd, result = async (data) => {
        logger.info("EMAIL : " + req.body.id);
        await UserModel.findOne({ email: req.body.id }), async (err, returnedUser) => {
          if (err) {
            logger.error("SERVER ROUTER: Error in getting User plan ID : " + err);
          } else {
            data.planChosen = returnedUser.planChosen;
            return res.send(data);
          }
        }
        return res.send(data);
      })
    } catch (err) {
      logger.error("SERVER ROUTER: Error after calling AuthService -> " + err);
      return res.status(500).send("Authentication Failed");
    }
  } else {
    try {
      await AuthService.createUser(req.body.id, req.body.pwd, result = async (data) => {
        PlanModel.findOne({ planName: defaultPlanName }, async (err, returnedPlan) => {
          if (err) {
            logger.error("SERVER ROUTER: Error in getting default plan ID : " + err);
          } else {
            UserModel.create({
              email: req.body.id,
              planChosen: returnedPlan._id // Set all new users with default plan initially
            });
          }
        });
        data.planChosen = returnedPlan._id;
        return res.send(data);
      })
    } catch (err) {
      logger.error("SERVER ROUTER: Error after calling AuthService -> " + err);
      return res.status(500).send("Unable to register new user");
    }
  };
});

router.post('/plans', async function (req, res, next) {
  try {
    await PlanModel.create({
      creatorEmail: req.body.creatorEmail,
      planName: req.body.planName,
      description: req.body.description,
      passages: req.body.passages
    }, function (err, createdPlan) {
      if (err) {
        logger.error("SERVER ROUTER: plan creation --> " + err);
        return next(err);
      } else {
        logger.info("SERVER ROUTER: Plan : " + req.body.planName + " created");
      }
    });
  }
  catch (err) {
    logger.error("SERVER ROUTER: plans --> " + err);
  }
});

module.exports = router;

// Helper Functions

// Default if anything goes wrong in a plan is proverb for the day of the month
function getDefaultPassage() {

  var day = new Date().getDate();
  var s = "Proverbs " + day;
  return s;
}