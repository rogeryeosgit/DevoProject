<template>
  <v-layout column justify-center align-center>
    <v-flex>
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
  props: ['passageDate', 'passageContents', 'reference'],
  computed: {
    passage: function () {
      // Format passage verses to be superscript
      var temp = this.passageContents.replace(/(\[)(\d)/g, this.frontBracketReplacer);
      return temp.replace(/(\d)(\])/g, this.backBracketReplacer);
    }
  },
  methods: {
    frontBracketReplacer(match, p1, p2) {
      return '<b><sup>' + p2;
    },
    backBracketReplacer(match, p1, p2) {
      return p1 + '</sup></b>';
    }
  }
};
</script>
