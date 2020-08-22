var axios = require("axios");
var log4js = require("log4js");
var admin = require("firebase-admin");
var serviceAccount = require("../../qtapp-3b06e-firebase-adminsdk-crr23-15b020dc01.json");

var endPt;
var fbAPIKey =
  "AIzaSyC0uyISu-yNt96T8VBT9_attsIDuuw77O4"; /* TODO: To be removed on deploy */
var logger = log4js.getLogger();

var AuthService = {
  init: function() {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://qtapp-3b06e.firebaseio.com"
    });
  },
  createUser: async function(id, pwd, callback) {
    endPt = "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=";
    try {
      await axios
        .post(endPt + fbAPIKey, {
          email: id,
          password: pwd,
          returnSecureToken: true
        })
        .then(result => {
          var tokenData = {
            idToken: result.data.idToken,
            exTime: result.data.expiresIn
          };
          logger.info("AUTH: In createUser: " + id + " has been created");
          callback(tokenData);
        });
    } catch (err) {
      logger.error(
        "AUTH: IN createUser: Error Returned during Axios -> " + err
      );
      throw err;
    }
  },
  getUser: async function(id, pwd, callback) {
    endPt =
      "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=";
    try {
      await axios
        .post(endPt + fbAPIKey, {
          email: id,
          password: pwd,
          returnSecureToken: true
        })
        .then(result => {
          var tokenData = {
            idToken: result.data.idToken,
            exTime: result.data.expiresIn
          };
          callback(tokenData);
        });
      logger.info("AUTH: In getUser: " + id + " has logged in");
    } catch (err) {
      logger.error("AUTH: IN getUser: Error Returned during Axios -> " + err);
      throw err;
    }
  },
  checkUser: async function(req, userEmailID) {
    const bearerHeader = req.headers["authorization"];

    if (bearerHeader) {
      const bearer = bearerHeader.split(" ");
      const bearerToken = bearer[1];

      // idToken comes from the client app
      await admin
        .auth()
        .verifyIdToken(bearerToken)
        .then(function(decodedToken) {
          logger.info("AUTH: User token verified");

          if (userEmailID) {
            if (decodedToken.email !== userEmailID) {
              logger.error("AUTH: User Email Mismatch");
              throw new Error("Not Authorized!");
            }
          }
          return;
        })
        .catch(function(error) {
          logger.error("AUTH: Token Error");
          throw new Error("Not Authorized!");
        });
    }
    // console.log(req.headers['cookie']);
  }
};

module.exports = AuthService;
