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
        return await this.$axios.$post("/qtJournalEntries", {
             creatorEmail: entrySubmitted.creatorEmail,
             date: entrySubmitted.date,
             passageReference: entrySubmitted.passageReference,
             title: entrySubmitted.title,
             thoughts: entrySubmitted.thoughts,
             applicationImplication: entrySubmitted.applicationImplication
        }).then(response => {
            if (response === 'Created') { // 201
                vuexContext.commit('addEntry', entrySubmitted);
            }
        }).catch(e => console.log(e));
    },
    storeAllQTEntries(vuexContext, entries) {
        vuexContext.commit('setAllQTEntries', entries);
    }
}

export const getters = {
    getAllQTEntries(state) {
        return state.qtEntries
    },
    getEntryUsingID: (state) => (id) => {
        return state.qtEntries.find(x => x._id === id);
    }
}