import Cookie from 'js-cookie';

export const state = () => ({
    token: null,
    exTime: null,
    planID: null,
    userID: null
})

export const mutations = {
    setToken(state, token) {
        state.token = token
    },
    clearToken(state) {
        state.token = null;
    },
    setExpiryTime(state, time) {
        state.exTime = time;
    },
    clearExpiryTime(state) {
        state.exTime = null;
    },
    setPlanID(state, id) {
        state.planID = id;
    },
    clearPlanID(state) {
        state.planID = null;
    },
    setUserID(state,userID) {
        state.userID = userID;
    },
    clearUserID(state) {
        state.userID = null;
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
                expires: new Date(expiringTimeInMS) // JS in millisecond * 1000
            }); // sameSite only allows cookies to be attached to get requests for cross origin requests
            Cookie.set('expirationTime', expiringTimeInMS, {
                sameSite: 'lax',
                expires: new Date(expiringTimeInMS) // JS in millisecond * 1000
            }); // sameSite only allows cookies to be attached to get requests for cross origin requests
            vuexContext.commit('setUserID', authData.id);
        }).catch(e => console.log(e));
    },
    initAuth(vuexContext, req) {
        let token;
        let expirationTime;

        if (req) {
            if (!req.headers.cookie) {
                return;
            }
            const jwtCookie = req.headers.cookie.split(';').find(c => c.trim().startsWith("jwt="));
            if (!jwtCookie) {
                return;
            }
            token = jwtCookie.split("=")[1];
            expirationTime = req.headers.cookie.split(';').find(c => c.trim().startsWith("expirationTime="))
                .split("=")[1];
        } else {
            token = Cookie.get("jwt");
            expirationTime = Cookie.get("expirationTime");
        }
        if (new Date().getTime() > +expirationTime || !token) {
            console.log('No Token or invalid token');
            vuexContext.dispatch('logout');
            return;
        }
        vuexContext.commit("setToken", token);
        vuexContext.commit("setExpiryTime", expirationTime);
    },
    logout(vuexContext) {
        // Clearing everthing just in case
        console.log("UserStore: Logout is called");
        vuexContext.commit('clearToken');
        vuexContext.commit('clearExpiryTime');
        Cookie.remove('jwt');
        Cookie.remove('expirationTime');
        vuexContext.commit('clearUserID');
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
    getPlan(state) {
        return state.planID;
    },
    getUserID(state) {
        return state.userID;
    }
}