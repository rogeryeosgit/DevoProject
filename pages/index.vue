<template>
  <div>
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="10">
          <v-card outlined>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  class="headline mb-1 text-wrap"
                >Your Personal QT and Journaling App</v-list-item-title>
                <v-list-item-subtitle class="text--primary text-wrap">
                  Practice PRESS in building your Quiet Time habits! This app
                  aims to help you build a habit of journaling your QT thoughts.
                  Bible passages change every day.
                  <br />
                  <br />P - Pray
                  <br />R - Read the Passage
                  <br />E - Examine
                  your own life
                  <br />S - Say it back to God
                  <br />S - Share it
                  with another
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-card>
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="12" md="10" align-self="center">
          <Passage
            :passageDate="date"
            :passageContents="getPassageContents"
            :reference="getReference"
          ></Passage>
        </v-col>
      </v-row>
    </v-container>
    <center>
      <v-btn v-if="isAuthenticated" to="/journalList/createEntry" nuxt exact color="primary">Write down your thoughts</v-btn>
      <v-btn v-if="!isAuthenticated" to="/auth" nuxt exact color="primary">Log in to journal your thoughts!</v-btn>
    </center>
  </div>
</template>

<script>
import Passage from "@/components/Passage";

export default {
  data() {
    return {
      date: new Date(),
    };
  },
  components: {
    Passage,
  },
  middleware: ["checkAuth"],
  computed: {
    getPassageContents: function () {
      return this.$store.getters["passageStore/getTodaysPassage"];
    },
    getReference: function () {
      return this.$store.getters["passageStore/getTodaysReference"];
    },
    isAuthenticated() {
      return this.$store.getters["userStore/isAuthenticated"];
    },
  },
};
</script>
