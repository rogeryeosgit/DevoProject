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
        state.plans.$set(state.plans.length, plan);
    },
    deletePlan(state, id) {
        for (let i in state.plans) {
            if (state.plans[i]._id === id) {
                state.plans.splice(i, 1);
            }
        }
    },
    updatePlan(state, plan) {
        for (let i in state.plans) {
            if (state.plans[i]._id === plan._id) {
                state.plans[i].creatorEmail = plan.creatorEmail;
                state.plans[i].planName = plan.planName;
                state.plans[i].description = plan.description;
                state.plans[i].passages = plan.passages;
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
    async updatePlan(vuexContext, planSubmitted) {
        vuexContext.dispatch("userStore/syncCookie", '', { root: true });
        return await this.$axios.put("/plans", {
            planID: planSubmitted._id,
            creatorEmail: planSubmitted.creatorEmail,
            planName: planSubmitted.planName,
            description: planSubmitted.description,
            passages: planSubmitted.passages
        }).then(result => {
            if (result.status === 201) {
                vuexContext.commit('updatePlan', planSubmitted);
            }
        }).catch(e => console.log(e));
    },
    async setChosenPlan(vuexContext, planID) {
        vuexContext.commit('setChosenPlan', planID);
        var userID = vuexContext.rootState.userStore.userID;
        return await this.$axios.$post("/users/planChosen", {
            userID: userID,
            planChosen: planID
        }).then(result => {
            if (result === "Created") {
                // Success!
                vuexContext.dispatch('passageStore/refreshPassage', '', { root: true });
            }
        }).catch(e => console.log(e));
    },
    clearChosenPlan(vuexContext) {
        vuexContext.commit('clearChosenPlan');
    },
    storePlans(vuexContext, plans) {
        vuexContext.commit('setPlans', plans);
    },
    async getPlanChosen(vuexContext) {
        var id = vuexContext.rootState.userStore.userID;
        if (id == null) {
            return; // When no one has logged in yet
        }
        return await this.$axios.$get('/users/planChosen', {
            params: {
                userID: id
            }
        }).then(data => {
            vuexContext.commit('setChosenPlan', data);
        }).catch(e => console.log(e))
    },
    async deletePlan(vuexContext, pID) {
        vuexContext.dispatch("userStore/syncCookie", '', { root: true });
        return await this.$axios.delete('/plans', {
            params: {
                planID: pID
            }
        }).then(data => {
            if (data.status === 204) {
                vuexContext.commit('deletePlan', pID);
            }
        }).catch(e => console.log(e))
    },
    clearPlans(vuexContext) {
        vuexContext.commit('clearPlans');
    }
}

export const getters = {
    getPlans(state) {
        return state.plans;
    },
    getChosenPlan(state) {
        return state.chosenPlan;
    },
    getPlanUsingID: (state) => (id) => {
        return state.plans.find(x => x._id === id);
    }
}