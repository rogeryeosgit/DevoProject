<template>
  <div>
    <v-card>
      <v-card-title>{{ entryTitle }}</v-card-title>
      <v-card-subtitle>{{ entryDate | dateFormatter }} - {{ entryPassageReference }}</v-card-subtitle>
      <v-card-text>{{ entryShortThoughts }}</v-card-text>
      <v-card-actions>
        <v-btn @click="$emit('view-entry', entryID)" color="blue" text>View Full Entry</v-btn>
      </v-card-actions>
    </v-card>
    <br />
  </div>
</template>

<script>
export default {
  props: [
    "entryID",
    "entryTitle",
    "entryDate",
    "entryPassageReference",
    "entryThoughts"
  ],
  computed: {
    entryShortThoughts: function() {
      return this.entryThoughts.slice(0,200) + "...";
    }
  }
};
</script>

