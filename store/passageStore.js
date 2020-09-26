export const state = () => ({
    todaysPassage: null,
    todaysReference: null
})

export const mutations = {
    setTodaysPassage(state, passage) {
        state.todaysPassage = passage
    },
    setTodaysReference(state, reference) {
        state.todaysReference = reference
    }
}

export const actions = {
    async refreshPassage(vuexContext, req) {
        var chosenPlan = vuexContext.rootState.planStore.chosenPlan;
        return await this.$axios.$get('/passages/today', {
            params: {
                planID: chosenPlan
            }
        }).then(data => {
            vuexContext.commit('setTodaysPassage', data.passages[0])
            vuexContext.commit('setTodaysReference', data.canonical)
        }).catch(e => {
            console.log(e);
        });
    }
}

export const getters = {
    getTodaysPassage(state) {
        return state.todaysPassage
    },
    getTodaysReference(state) {
        return state.todaysReference
    }
}