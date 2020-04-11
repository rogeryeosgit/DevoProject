import Cookie from 'js-cookie';

export const state = () => ({
    token: null,
    exTime: null
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
    }
}

export const actions = {
    async authenticateUser(vuexContext, authData) {
        return await this.$axios.$post("/getAuthenticated", {
            id: authData.id,
            pwd: authData.pwd,
            isLogin: authData.isLogin
        }).then(result => {
            vuexContext.commit('setToken', result.idToken);
            vuexContext.commit('setExpiryTime', new Date().getTime() + Number.parseInt(result.exTime) * 1000);
            Cookie.set('jwt', result.idToken); // Cookie has some issues
            Cookie.set('expirationDate', new Date().getTime() + Number.parseInt(result.exTime) * 1000);
            console.log("This data is returned : " + result.idToken + " " + result.exTime);
        }).catch(e => console.log(e));
    },
    logout(vuexContext) {
        console.log("UserStore: Logout is called");
        vuexContext.commit('clearToken');
        Cookie.remove('jwt');
        Cookie.remove('expirationDate');
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
    }
}