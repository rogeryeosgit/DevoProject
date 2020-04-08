var axios = require('axios');

const endPt = '';
const token = '';
const fbAPIKey = 'AIzaSyC0uyISu-yNt96T8VBT9_attsIDuuw77O4'; /* TODO: To be removed on deploy */

var authService = {
    authenticateUser: async function (id, pwd, isLogin) {
        if (!isLogin) {
            endPt = "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=";
        }
        else {
            endPt = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=";
        }
        try {
            await axios.post(endPT + fbAPIKey,
                {
                    email: id,
                    password: pwd,
                    returnSecureToken: true
                }
            ).then(result => {
                token = result.idToken;
                //Cookie.set('jwt', result.idToken);
                //Cookie.set('expirationDate', new Date().getTime() + Number.parseInt(result.expiresIn) * 1000);
                console.log("Token = " + token);
                return token;
            })
        } catch (err) {
            return next(err);
        }
    }
};

module.exports = authService;