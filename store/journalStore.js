export const state = () => ({
    qtEntries: []
})

export const mutations = {
    setAllQTEntries(state, entries) {
        state.qtEntries = entries
    },
    addEntry(state, entry) {
        state.qtEntries.push(entry);
    }
}

export const actions = {
    async createEntry(vuexContext, entrySubmitted) {
        return await this.$axios.$post("/qtEntries", {
             creatorEmail: entrySubmitted.creatorID,
            // planName: planSubmitted.planName,
            // description: planSubmitted.description,
            // passages: planSubmitted.passages
        }).then(result => {
            if (result.status === 201) {
                vuexContext.commit('addEntry', entrySubmitted);
            }
        }).catch(e => console.log(e));
    },
}

export const getters = {
    getAllQTEntries(state) {
        return state.qtEntries
    }
}