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
    },
    addPlan(state, plan) {
        state.plan.push(plan);
    },
    deletePlan(state, id) {
        for (let i in state.plans) {
            if (state.plans[i]._id === id) {
                state.plans.splice(i, 1);
            }
        }
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
            if (result.status === 201) {
                vuexContext.commit('addPlan', planSubmitted);
            }
        }).catch(e => console.log(e));
    },
    setChosenPlan(vuexContext, planID) {
        vuexContext.commit('setChosenPlan', planID);
    },
    clearChosenPlan(vuexContext) {
        vuexContext.commit('clearChosenPlan');
    },
    storePlans(vuexContext, plans) {
        vuexContext.commit('setPlans', plans);
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
    },
    async deletePlan(vuexContext, pID) {
        return await this.$axios.delete('/plans', {
            params: {
                planID: pID
            }
        }).then(data => {
            if (data.status === 204) {
                vuexContext.commit('deletePlan', pID);
            }
        }).catch(e => console.log(e))
    }
}

export const getters = {
    getPlans(state) {
        return state.plans;
    },
    getChosenPlan(state) {
        return state.chosenPlan;
    }
}