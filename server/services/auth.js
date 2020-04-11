var axios = require('axios');
var log4js = require('log4js');

var endPt;
var fbAPIKey = "AIzaSyC0uyISu-yNt96T8VBT9_attsIDuuw77O4"; /* TODO: To be removed on deploy */

var AuthService = {
    authenticateUser: async function (id, pwd, isLogin, callback) {
        var logger = log4js.getLogger();

        if (!isLogin) {
            endPt = "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=";
        }
        else {
            endPt = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=";
        }
        try {
            logger.debug("AUTH: About to Axios to Google");
            await axios.post(endPt + fbAPIKey,
                {
                    email: id,
                    password: pwd,
                    returnSecureToken: true
                }
            ).then(result => {
                logger.debug("AUTH: Token that is being returned -> " + result.data.idToken);
                var tokenData = {
                    idToken : result.data.idToken,
                    exTime : result.data.expiresIn
                }
                callback(tokenData);
            })
        } catch (err) {
            logger.error("AUTH: Error Returned during Axios -> " + err);
        }
    }
};

module.exports = AuthService;