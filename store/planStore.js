export const state = () => ({
    chosenPlan: null,
    plans: []
})

export const mutations = {
    setChosenPlan(state, plan) {
        state.chosenPlan = plan;
    },
    setPlans(state, plans) {
        state.plans = plans;
    }
}

export const actions = {
    async createPlan(vuexContext) {
        return await this.$axios.$post("/plans", {
        }).then(result => {
            console.log("Creation request made ! ");
        }).catch(e => console.log(e));
    }
}

export const getters = {
}