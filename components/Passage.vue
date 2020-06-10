<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8 md6>
      <v-card>
        <v-card-title>{{ reference }}</v-card-title>
        <v-card-subtitle>{{ passageDate | dateFormatter }}</v-card-subtitle>
        <v-card-text v-html="passage" class="text--primary" id="verse-number-sup"></v-card-text>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  props: ['passageDate'],
  computed: {
    passage: function() {
      var returnedPassage = this.$store.getters['passageStore/getTodaysPassage'];
      var temp = returnedPassage.replace(/\[/g, '<sup>');
      return temp.replace(/\]/g, '</sup>');
      // return returnedPassage;
    },
    reference: function() {
      return this.$store.getters['passageStore/getTodaysReference'];
    }
  }
};
</script>
