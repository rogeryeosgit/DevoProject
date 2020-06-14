export const state = () => ({
    chosenPlan: null,
    plans: []
})

export const mutations = {
    setChosenPlan(state, plan) {
        state.chosenPlan = plan;
    },
    clearChosenPlan(state) {
        state.chosenPlan = null;
    },
    setPlans(state, plans) {
        state.plans = plans;
    },
    clearPlans(state) {
        state.plans = [];
    }
}

export const actions = {
    async createPlan(vuexContext, planSubmitted) {
        return await this.$axios.$post("/plans", {
            creatorEmail: planSubmitted.creatorEmail,
            planName: planSubmitted.planName,
            description: planSubmitted.description,
            passages: planSubmitted.passages
        }).then(result => {
        }).catch(e => console.log(e));
    },
    setChosenPlan(vuexContext, planID) {
        vuexContext.commit('setChosenPlan', planID);
    },
    clearChosenPlan(vuexContext) {
        vuexContext.commit('clearChosenPlan');
    },
    async getPlanChosen(vuexContext) {
        var id = vuexContext.rootState.userStore.userID;
        return await this.$axios.$get('/users/planChosen', {
            params: {
                userID: id
            }
        }).then(data => {
            vuexContext.commit('setChosenPlan', data);
        }).catch(e => console.log(e))
    }
}

export const getters = {
}