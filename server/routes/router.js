var express = require("express");
var router = express.Router();
var log4js = require("log4js");
var logger = log4js.getLogger();
var BRService = require("../services/bible-retrieval");
var AuthService = require("../services/auth");
var PlanModel = require("../services/models/Plan");
var UserModel = require("../services/models/User");
var QTEntryModel = require("../services/models/QTEntry");

var p = "";

// GET route after registering
router.get("/passages/today", async function (req, res, next) {
  // if (req.hasOwnProperty('query') && typeof req.query.planID !== 'undefined' && req.query.planID != null) {
  if (req.query.planID != null) {
    await PlanModel.findOne({ _id: req.query.planID }, async (err, returnedPlan) => {
      if (err) {
        logger.error("SERVER ROUTER: Error after looking up DB for default Plan : " + err);
        p = await BRService.getPassage(getDefaultPassage());
        return res.send(p);
      } else {
        try {
          var month =
            new Date().toString().substr(4, 3) +
            " " +
            new Date().toString().substr(11, 4);
          var day = new Date().getDate();
          p = await BRService.getPassage(
            returnedPlan.passages.get(month).get(day.toString())
          );
          return res.send(p);
        } catch (err) {
          logger.error("SERVER ROUTER: Error after trying to access ESV API during default : " + err);
          p = await BRService.getPassage(getDefaultPassage());
          return res.send(p);
        }
      }
    });
  } else {
    await PlanModel.findOne({ planName: "--- Default Nav Plan ---" },
      async (err, returnedPlan) => {
        if (err) {
          logger.error("SERVER ROUTER: Error after looking up DB for default Plan : " + err);
          p = await BRService.getPassage(getDefaultPassage());
          return res.send(p);
        } else {
          try {
            var month =
              new Date().toString().substr(4, 3) +
              " " +
              new Date().toString().substr(11, 4);
            var day = new Date().getDate();
            p = await BRService.getPassage(returnedPlan.passages.get(month).get(day.toString())
            );
            return res.send(p);
          } catch (err) {
            logger.error("SERVER ROUTER: Error after trying to access ESV API during default : " + err);
            p = await BRService.getPassage(getDefaultPassage());
            return res.send(p);
          }
        }
      }
    );
  }
});

// Get a particular passage
router.get("/passages", async function (req, res, next) {
  p = await BRService.getPassage(req.query.passageReference);
  return res.send(p);
});

router.post("/users", async function (req, res, next) {
  if (req.body.isLogin) {
    try {
      await AuthService.getUser(req.body.id, req.body.pwd, (result = async data => {
        return res.send(data);
      }));
    } catch (err) {
      logger.error("SERVER ROUTER: Error after calling AuthService -> " + err);
      return res.status(500).send("Authentication Failed");
    }
  } else {
    try {
      await AuthService.createUser(
        req.body.id,
        req.body.pwd,
        (result = async data => {
          PlanModel.findOne(
            { planName: "--- Default Nav Plan ---" },
            async (err, returnedPlan) => {
              if (err) {
                logger.error(
                  "SERVER ROUTER: Error in getting default plan ID : " + err
                );
              } else {
                UserModel.create({
                  email: req.body.id,
                  planChosen: returnedPlan._id // Set all new users with default plan initially
                });
              }
            }
          );
          return res.send(data);
        })
      );
    } catch (err) {
      logger.error("SERVER ROUTER: Error after calling AuthService -> " + err);
      return res.status(500).send("Unable to register new user");
    }
  }
});

// Send with user id for plan chosen by user
router.get("/users/planChosen", async function (req, res, next) {
  await UserModel.findOne({ email: req.query.userID }, (err, returnedUser) => {
    if (err) {
      logger.error("SERVER ROUTER: Error in getting User plan ID : " + err);
    } else {
      try {
        p = returnedUser.planChosen;
        return res.send(p);
      } catch {
        return res.sendStatus(400);
      }
    }
  });
});

// Send with user id for plan chosen by user
router.post("/users/planChosen", async function (req, res, next) {
  await UserModel.findOneAndUpdate({ email: req.body.userID }, { planChosen: req.body.planChosen }, (err, returnedUser) => {
    if (err) {
      logger.error("SERVER ROUTER: Error in getting User plan ID : " + err);
    } else {
      return res.sendStatus(201);
    }
  });
});

router.post("/plans", async function (req, res, next) {
  await AuthService.checkUser(req)
    .then(async () => {
      try {
        await PlanModel.create(
          {
            creatorEmail: req.body.creatorEmail,
            planName: req.body.planName,
            description: req.body.description,
            passages: req.body.passages
          },
          function (err, createdPlan) {
            if (err) {
              logger.error("SERVER ROUTER: plan creation --> " + err);
              return next(err);
            } else {
              logger.info(
                "SERVER ROUTER: Plan : " + req.body.planName + " created"
              );
              return res.sendStatus(201);
            }
          }
        );
      } catch (err) {
        logger.error("SERVER ROUTER: plans --> " + err);
      }
    }).catch(error => {
      logger.error("SERVER ROUTER: Error in creating plan : " + error);
      return res.sendStatus(401);
    });
});

// Get full list of plans
router.get("/plans", async function (req, res, next) {
  await AuthService.checkUser(req)
    .then(async () => {
      await PlanModel.find({}, (err, returnedPlans) => {
        if (err) {
          logger.error("SERVER ROUTER: Error in retrieving all plans : " + err);
        } else {
          return res.send(returnedPlans);
        }
      });
    }).catch(error => {
      logger.error("SERVER ROUTER: Error in retrieving all plans : " + error);
      return res.sendStatus(401);
    });
});

router.put("/plans", async function (req, res, next) {
  await AuthService.checkUser(req)
    .then(async () => {
      await PlanModel.findOne({ _id: req.body.planID }, async (err, returnedPlan) => {
        if (err) {
          logger.error("SERVER ROUTER: Error in checks for update of plans : " + err);
        } else {
          await AuthService.checkPlanOwnership(req, returnedPlan.creatorEmail, (async isOwner => {
            if (isOwner) {
              try {
                await PlanModel.findByIdAndUpdate({ _id: req.body.planID }, {
                  planName: req.body.planName,
                  description: req.body.description,
                  passages: req.body.passages
                }, function (err, createdPlan) {
                  if (err) {
                    logger.error("SERVER ROUTER: plan update --> " + err);
                    return next(err);
                  } else {
                    logger.info("SERVER ROUTER: Plan : " + req.body.planName + " updated");
                    return res.sendStatus(201);
                  }
                });
              } catch (err) {
                logger.error("SERVER ROUTER: Plan Update Error --> " + err);
              }
            } else {
              res.sendStatus(400);
            }
          }));
        }
      });
    }).catch(error => {
      logger.error("SERVER ROUTER: Error in updating plan : " + error);
      return res.sendStatus(401);
    });
});

router.delete("/plans", async function (req, res, next) {
  await AuthService.checkUser(req)
    .then(async () => {
      await PlanModel.findOne({ _id: req.query.planID }, async (err, returnedPlan) => {
        if (err) {
          logger.error("SERVER ROUTER: Error in checks for deletion of plans : " + err);
        } else {
          await AuthService.checkPlanOwnership(req, returnedPlan.creatorEmail, (async isOwner => {
            if (isOwner) {
              await PlanModel.deleteOne({ _id: req.query.planID }, err => {
                if (err) {
                  logger.error("SERVER ROUTER: Error in deleting plan : " + err);
                } else {
                  logger.info("SERVER ROUTER: Plan ID : " + req.query.planID + " has been deleted");
                  return res.sendStatus(204);
                }
              });
            } else {
              res.sendStatus(400);
            }
          }));
        }
      });
    }).catch(error => {
      logger.error("SERVER ROUTER: Error in deleting plan : " + error);
      return res.sendStatus(401);
    });
});

router.post("/qtJournalEntries", async function (req, res, next) {
  await AuthService.checkUser(req, req.query.creatorEmail)
    .then(async () => {
      try {
        await QTEntryModel.create(
          {
            creatorEmail: req.body.creatorEmail,
            date: req.body.date,
            passageReference: req.body.passageReference,
            title: req.body.title,
            thoughts: req.body.thoughts,
            applicationImplication: req.body.applicationImplication
          },
          function (err, createdEntry) {
            if (err) {
              logger.error("SERVER ROUTER: qtEntry creation --> " + err);
              return next(err);
            } else {
              logger.info("SERVER ROUTER: qtEntry created");
              return res.sendStatus(201);
            }
          }
        );
      } catch (err) {
        logger.error("SERVER ROUTER: QT Entry Creation --> " + err);
      }
    })
    .catch(error => {
      logger.error("SERVER ROUTER: Error in creating qt entry : " + error);
      return res.sendStatus(401);
    });
});

// Get list of qt entries, need user email
router.get("/qtJournalEntries", async function (req, res, next) {
  await AuthService.checkUser(req, req.query.creatorEmail)
    .then(async () => {
      await QTEntryModel.find(
        { creatorEmail: req.query.creatorEmail },
        (err, returnedEntries) => {
          if (err) {
            logger.error(
              "SERVER ROUTER: Error in retrieving all qt entries : " +
              err +
              " ---- user email : " +
              req.query.creatorEmail
            );
          } else {
            return res.send(returnedEntries);
          }
        }
      );
    })
    .catch(error => {
      logger.error(
        "SERVER ROUTER: Error in retrieving all qt entries : " + error
      );
      return res.sendStatus(401);
    });
});

router.put("/qtJournalEntries", async function (req, res, next) {
  await AuthService.checkUser(req)
    .then(async () => {
      try {
        await QTEntryModel.findOneAndUpdate(
          {
            _id: req.body.journalID
          },
          {
            title: req.body.title,
            thoughts: req.body.thoughts,
            applicationImplication: req.body.applicationImplication,
          },
          function (err, createdEntry) {
            if (err) {
              logger.error("SERVER ROUTER: QT Journal entry update --> " + err);
              return next(err);
            } else {
              logger.info(
                "SERVER ROUTER: QT Journal entry : " +
                req.body.title +
                " updated"
              );
              return res.sendStatus(200);
            }
          }
        );
      } catch (err) {
        logger.error("SERVER ROUTER: QT Journal entry update --> " + err);
      }
    })
    .catch(error => {
      logger.error("SERVER ROUTER: Error in updating qt entry : " + error);
      return res.sendStatus(401);
    });
});

router.delete("/qtJournalEntries", async function (req, res, next) {
  await AuthService.checkUser(req)
    .then(async () => {
      await QTEntryModel.deleteOne({ _id: req.query.journalID }, err => {
        if (err) {
          logger.error("SERVER ROUTER: Error in deleting entry : " + err);
        } else {
          logger.info(
            "SERVER ROUTER: QT Journal Entry ID : " +
            req.query.journalID +
            " has been deleted"
          );
          return res.sendStatus(200);
        }
      });
    })
    .catch(error => {
      logger.error("SERVER ROUTER: Error in deleting qt entry : " + error);
      return res.sendStatus(401);
    });
});

module.exports = router;

// Helper Functions

// Default if anything goes wrong in a plan is proverb for the day of the month
function getDefaultPassage() {
  var day = new Date().getDate();
  var s = "Proverbs " + day;
  return s;
}
