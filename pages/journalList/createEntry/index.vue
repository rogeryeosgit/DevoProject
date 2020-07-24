<template>
  <div>
    <Passage :passageDate="date" :passageContents="getPassageContents" :reference="getReference"></Passage>
    <v-form v-model="valid">
      <v-container>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field v-model="title" :counter="10" label="Title" required></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6">
            <v-textarea
              solo
              name="input-7-4"
              label="Thoughts"
              value="The Woodman set to work at once, and so sharp was his axe that the tree was soon chopped nearly through."
            ></v-textarea>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field v-model="application" :counter="10" label="Application / Implication" required></v-text-field>
          </v-col>
        </v-row>
      </v-container>
      <v-btn @click="cancel" color="error">Cancel</v-btn>
      <v-btn @click="submit" color="success">Save</v-btn>
    </v-form>
  </div>
</template>

<script>
import Passage from "@/components/Passage";

export default {
  middleware: ["checkAuth", "loginCheck"],
  components: {
    Passage
  },
  data() {
    return {
      date: new Date(),
      valid: false,
      title: "",
      application: ""
    };
  },
  methods: {
    submit: function() {
      // save function to be done up
      this.$router.push("/journalList");
    },
    cancel: function() {
      this.$router.push("/journalList");
    }
  },
  computed: {
    getPassageContents: function() {
      return this.$store.getters["passageStore/getTodaysPassage"];
    },
    getReference: function() {
      return this.$store.getters["passageStore/getTodaysReference"];
    }
  }
};
</script>