import Vue from 'vue'

export const state = () => ({
    qtEntries: []
})

export const mutations = {
    setAllQTEntries(state, entries) {
        state.qtEntries = entries
    },
    addEntry(state, entry) {
        Vue.set(state.qtEntries, state.qtEntries.length, entry);
    },
    updateEntry(state, entry) {
        for (let i in state.qtEntries) {
            if (state.qtEntries[i]._id === entry.journalID) {
                state.qtEntries[i].title = entry.title;
                state.qtEntries[i].thoughts = entry.thoughts;
                state.qtEntries[i].applicationImplication = entry.applicationImplication;
            }
        }
    },
    deleteEntry(state, id) {
        for (let i in state.qtEntries) {
            if (state.qtEntries[i]._id === id) {
                state.qtEntries.splice(i, 1);                
            }
        }
    },
    clearEntries(state) {
        state.qtEntries = [];
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
    },
    async updateEntry(vuexContext, entrySubmitted) {
        return await this.$axios.$put("/qtJournalEntries", {
            journalID: entrySubmitted.journalID,
            title: entrySubmitted.title,
            thoughts: entrySubmitted.thoughts,
            applicationImplication: entrySubmitted.applicationImplication
       }).then(response => {
           if (response === 'OK') { // 200
               vuexContext.commit('updateEntry', entrySubmitted);
           }
       }).catch(e => console.log(e));
    },
    async deleteEntry(vuexContext, jID) {
        return await this.$axios.delete('/qtJournalEntries', {
            params: {
                journalID: jID
            }
        }).then(response => {
            if (response.status === 200) {
                vuexContext.commit('deleteEntry', jID);
            }
        }).catch(e => console.log(e))
    },
    clearEntries(vuexContext) {
        vuexContext.commit('clearEntries');
    }
}

export const getters = {
    getAllQTEntries(state) {
        return state.qtEntries
    },
    getEntryUsingID: (state) => (id) => {
        return state.qtEntries.find(x => x._id === id);
    },
    getQTEntriesLength(state) {
        return state.qtEntries.length;
    }
}