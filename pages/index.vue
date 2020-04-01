<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8 md6>
      <v-card>
        <v-card-title class="headline">Welcome to the Vuetify + Nuxt.js template +++</v-card-title>
        <v-card-text :passage='getPassage'>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" nuxt to="/inspire">Continue</v-btn>
        </v-card-actions>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  computed: {
    getPassage() {
      return this.$store.getters.getTodaysPassage
    }
  }
};
</script>
