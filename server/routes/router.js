var express = require('express');
var router = express.Router();
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
    console.log("id: " + req.body.id);
    console.log("pwd: " + req.body.pwd);
    console.log("isLogin: " + req.body.isLogin);
    token = await AuthService.authenticateUser(req.body.id, req.body.pwd, req.body.isLogin);
  } catch (err) {
    console.log("This is the error" + err);
    return next(err);
  }
  return res.send(token);
});

module.exports = router;