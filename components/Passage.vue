<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8 md6>
      <v-card>
        <v-card-title class="headline">{{ reference }} - {{ passageDate | dateFormatter }}</v-card-title>
        <v-card-text class="text--primary">{{ passage }}</v-card-text>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  props: {
    passageDate: {
      required: true
    }
  },
  computed: {
    passage: function() {
      return this.$store.getters['passageStore/getTodaysPassage'];
    },
    reference: function() {
      return this.$store.getters['passageStore/getTodaysReference'];
    }
  }
};
</script>
