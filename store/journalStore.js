export const state = () => ({
    entries: []
})

export const mutations = {
    setAllEntries(state, entries) {
        state.entries = entries
    },
    addEntry(state, entry) {
        state.entries.push(entry);
    }
}

export const actions = {
    async createEntry(vuexContext, entrySubmitted) {
        return await this.$axios.$post("/journalEntries", {
            // creatorEmail: planSubmitted.creatorEmail,   TOBE DONE
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
    getAllEntries(state) {
        return state.entries
    }
}