import Vuex from 'vuex';

const createStore = () => {
    return new Vuex.Store({
        state: {
            todaysPassage: null,
            todaysRefernce: null
        },
        mutations: {
            setTodaysPassage(state, passage) {
                state.todaysPassage = passage
            },
            setTodaysReference(state, reference) {
                state.todaysReference = reference
            }
        },
        actions: {
            nuxtServerInit(vuexContext, context) {
                return context.app.$axios.$get('/getTodaysPassage') //because on server side and not this.$axios
                    .then(data => {
                        vuexContext.commit('setTodaysPassage', data.passages[0])
                        vuexContext.commit('setTodaysReference', data.canonical)
                    }).catch(e => context.error(e))
            }
        },
        getters: {
            getTodaysPassage(state) {
                return state.todaysPassage
            },
            getTodaysReference(state) {
                return state.todaysReference
            }
        }
    })
}

export default createStore;