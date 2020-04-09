var axios = require('axios');
var logger = require('./logger');

var endPt;
var token;
var fbAPIKey = "AIzaSyC0uyISu-yNt96T8VBT9_attsIDuuw77O4"; /* TODO: To be removed on deploy */

var authService = {
    authenticateUser: async function (id, pwd, isLogin) {
        if (!isLogin) {
            endPt = "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=";
        }
        else {
            endPt = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=";
        }
        try {
            logger.debug("AUTH: About to Axios to Google");
            const result = await axios.post(endPt + fbAPIKey,
                {
                    email: id,
                    password: pwd,
                    returnSecureToken: true
                }
            )
            logger.debug("AUTH: Result of idToken -> " + result.idToken);
            return next(result.idToken);

            /* .then(result => {
                console.log("Was I here?");
                token = result.idToken;
                //Cookie.set('jwt', result.idToken);
                //Cookie.set('expirationDate', new Date().getTime() + Number.parseInt(result.expiresIn) * 1000);
                console.log("Token = " + token);
                return token;
            }) */
        } catch (err) {
            logger.error("AUTH: Error Returned during Axios -> " + err);
            return next(err);
        }
    }
};

module.exports = authService;