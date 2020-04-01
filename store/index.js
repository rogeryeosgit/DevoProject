import Vuex from 'vuex';

const createStore = () => {
    return new Vuex.Store({
        state: {
            todaysPassage: null
        },
        mutations: {
            setTodaysPassage(state, passage) {
                state.todaysPassage = passage
            }
        },
        actions: {
            nuxtServerInit(vuexContext, context) {
                return context.app.$axios.$get('/getTodaysPassage') //because on server side and not this.$axios
                    .then(data => {
                        vuexContext.commit('setTodaysPassage', data)
                    }).catch(e => context.error(e))
            }
        },
        getters: {
            getTodaysPassage(state) {
                return state.todaysPassage
            }
        }
    })
}

export default createStore;