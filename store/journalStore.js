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
             creatorEmail: entrySubmitted.creatorEmail,
             date: entrySubmitted.date,
             passageReference: entrySubmitted.passageReference,
             title: entrySubmitted.title,
             thoughts: entrySubmitted.thoughts,
             applicationImplication: entrySubmitted.applicationImplication
        }).then(result => {
            if (result.status === 201) {
                console.log("201 for qt entry post created received.");
                //vuexContext.commit('addEntry', entrySubmitted); HRM... doesn't arrive here?!
            }
        }).catch(e => console.log(e));
    },
}

export const getters = {
    getAllQTEntries(state) {
        return state.qtEntries
    }
}