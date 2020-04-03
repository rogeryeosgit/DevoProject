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
}

export const getters = {
    getTodaysPassage(state) {
        return state.todaysPassage
    },
    getTodaysReference(state) {
        return state.todaysReference
    }
}