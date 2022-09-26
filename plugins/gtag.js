import Vue from 'vue'
import VueGtag from 'vue-gtag'

Vue.use(VueGtag, {
    config: {
        id: process.env.GA_ID
    }
})