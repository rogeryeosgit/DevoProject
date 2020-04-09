export const state = () => ({
    token: null,
})

export const mutations = {
    setToken(state, token) {
        state.token = token
    }
}

export const actions = {
    async authenticateUser(vuexContext, authData) {
        vuexContext.commit('setToken', await this.$axios.$post("/getAuthenticated", {
            id: authData.id,
            pwd: authData.pwd,
            isLogin: authData.isLogin
        }));
    }
}

export const getters = {
    isAuthenticated(state) {
        return state.token;
    }
}