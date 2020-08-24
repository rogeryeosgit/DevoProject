import Cookie from 'js-cookie';

export const state = () => ({
    token: null,
    exTime: null,
    userID: null,
    error: null
})

export const mutations = {
    setToken(state, token) {
        state.token = token
        this.$axios.setToken(token, 'Bearer');
    },
    clearToken(state) {
        state.token = null;
        this.$axios.setToken(false);
    },
    setExpiryTime(state, time) {
        state.exTime = time;
    },
    clearExpiryTime(state) {
        state.exTime = null;
    },
    setUserID(state, userID) {
        state.userID = userID;
    },
    clearUserID(state) {
        state.userID = null;
    },
    setError(state, error) {
        state.error = error;
    },
    clearError(state) {
        state.error = null;
    }
}

export const actions = {
    async authenticateUser(vuexContext, authData) {
        return await this.$axios.$post("/users", {
            id: authData.id,
            pwd: authData.pwd,
            isLogin: authData.isLogin
        }).then(result => {
            vuexContext.commit('setToken', result.idToken);
            var expiringTimeInMS = new Date().getTime() + Number.parseInt(result.exTime) * 1000;
            vuexContext.commit('setExpiryTime', expiringTimeInMS);
            Cookie.set('jwt', result.idToken, {
                sameSite: 'lax',
                expires: new Date(expiringTimeInMS), // JS in millisecond * 1000
                secure: true
            }); // sameSite only allows cookies to be attached to get requests for cross origin requests
            Cookie.set('expirationTime', expiringTimeInMS, {
                sameSite: 'lax',
                expires: new Date(expiringTimeInMS), // JS in millisecond * 1000
                secure: true
            }); // sameSite only allows cookies to be attached to get requests for cross origin requests
            Cookie.set('qtAppID', authData.id, {
                sameSite: 'lax',
                expires: new Date(expiringTimeInMS), // JS in millisecond * 1000
                secure: true
            }); // sameSite only allows cookies to be attached to get requests for cross origin requests
            vuexContext.commit('setUserID', authData.id);
        }).catch(e => {
            vuexContext.commit('setError', e);
            console.log(e);
        });
    },
    clearError(vuexContext, req) {
        vuexContext.commit('clearError');
    },
    checkCookie(vuexContext, req) {
        let token;
        let expirationTime;
        let userID;

        if (req) {
            if (!req.headers.cookie) { // Addresses when store is still on Server side. No cookie yet
                return;
            }
            const jwtCookie = req.headers.cookie.split(';').find(c => c.trim().startsWith("jwt="));
            if (!jwtCookie) { // Address when there is no cookie for some reason, logged out, etc.
                return;
            }
            token = jwtCookie.split("=")[1];
            expirationTime = req.headers.cookie.split(';').find(c => c.trim().startsWith("expirationTime="))
                .split("=")[1];
            userID = req.headers.cookie.split(';').find(c => c.trim().startsWith("qtAppID="))
                .split("=")[1];
        } else { // Local Cookie
            token = Cookie.get("jwt");
            expirationTime = Cookie.get("expirationTime");
            userID = Cookie.get("qtAppID");
        }
        if (new Date().getTime() > +expirationTime || !token) {
            console.log('No Token or invalid token');
            vuexContext.dispatch('logout');
            return;
        }
        vuexContext.commit("setToken", token);
        vuexContext.commit("setExpiryTime", expirationTime);
        vuexContext.commit("setUserID", userID);
        vuexContext.dispatch("planStore/getPlanChosen", '', { root: true });
    },
    syncCookie(vuexContext) {
        let token;
        let expirationTime;
        let userID;
        
        token = Cookie.get("jwt");
        expirationTime = Cookie.get("expirationTime");
        userID = Cookie.get("qtAppID");

        if (new Date().getTime() > +expirationTime || !token) {
            console.log('No Token or invalid token');
            vuexContext.dispatch('logout');
            return;
        }
        vuexContext.commit("setToken", token);
        vuexContext.commit("setExpiryTime", expirationTime);
        vuexContext.commit("setUserID", userID);
    },
    logout(vuexContext) {
        // Clearing everthing just in case
        console.log("UserStore: Logout is called");
        vuexContext.commit('clearToken');
        vuexContext.commit('clearExpiryTime');
        vuexContext.commit('clearUserID');
        Cookie.remove('jwt');
        Cookie.remove('expirationTime');
        Cookie.remove('qtAppID');
        vuexContext.dispatch("planStore/clearPlans", '', { root: true });
        vuexContext.dispatch("journalStore/clearEntries", '', { root: true });
    }
}

export const getters = {
    getToken(state) {
        return state.token;
    },
    isAuthenticated(state) {
        return state.token != null;
    },
    getExpiryTime(state) {
        return state.exTime;
    },
    getUserID(state) {
        return state.userID;
    },
    errorOccured(state) {
        return state.error;
    }
}