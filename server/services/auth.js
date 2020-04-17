var axios = require('axios');
var log4js = require('log4js');

var endPt;
var fbAPIKey = "AIzaSyC0uyISu-yNt96T8VBT9_attsIDuuw77O4"; /* TODO: To be removed on deploy */
var logger = log4js.getLogger();

var AuthService = {
    createUser: async function (id, pwd, callback) {

        endPt = "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=";
        try {
            await axios.post(endPt + fbAPIKey,
                {
                    email: id,
                    password: pwd,
                    returnSecureToken: true
                }
            ).then(result => {
                var tokenData = {
                    idToken: result.data.idToken,
                    exTime: result.data.expiresIn
                }
                logger.info("AUTH: In createUser: " + id + " has been created");
                callback(tokenData);
            })
        } catch (err) {
            logger.error("AUTH: IN createUser: Error Returned during Axios -> " + err);
        }
    },
    getUser: async function (id, pwd, callback) {

        endPt = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=";
        try {
            await axios.post(endPt + fbAPIKey,
                {
                    email: id,
                    password: pwd,
                    returnSecureToken: true
                }
            ).then(result => {
                var tokenData = {
                    idToken: result.data.idToken,
                    exTime: result.data.expiresIn
                }
                callback(tokenData);
            })
            logger.info("AUTH: In getUser: " + id + " has logged in");
        } catch (err) {
            logger.error("AUTH: IN getUser: Error Returned during Axios -> " + err);
        }
    }
};

module.exports = AuthService;