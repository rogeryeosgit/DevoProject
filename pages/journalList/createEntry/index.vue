<template>
  <div>
    <v-form v-model="valid">
      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="8">
            <Passage
              :passageDate="date"
              :passageContents="getPassageContents"
              :reference="getReference"
            ></Passage>
          </v-col>
          <v-col>
            <v-row>
              <v-col>
                <v-text-field v-model="title" :counter="20" label="Title" required></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-textarea
                  auto-grow
                  solo
                  v-model="thoughts"
                  label="This part of the passage tells me that..."
                ></v-textarea>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-text-field
                  v-model="applicationImplication"
                  label="Application / Implication"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-container>
    </v-form>
    <v-btn @click="cancel" color="error">Cancel</v-btn>
    <v-btn @click="submit" color="success">Save</v-btn>
  </div>
</template>

<script>
import Passage from "@/components/Passage";

export default {
  middleware: ["checkAuth", "loginCheck"],
  components: {
    Passage,
  },
  data() {
    return {
      date: new Date(),
      valid: false,
      title: "",
      thoughts: "",
      applicationImplication: "",
    };
  },
  methods: {
    submit: function () {
      var userID = this.$store.getters["userStore/getUserID"];

      this.$store.dispatch("journalStore/createEntry", {
        creatorEmail: userID,
        date: this.date,
        passageReference: this.getReference,
        title: this.title,
        thoughts: this.thoughts,
        applicationImplication: this.applicationImplication,
      });
      this.$router.push("/journalList");
    },
    cancel: function () {
      this.$router.push("/journalList");
    },
  },
  computed: {
    getPassageContents: function () {
      return this.$store.getters["passageStore/getTodaysPassage"];
    },
    getReference: function () {
      return this.$store.getters["passageStore/getTodaysReference"];
    },
  },
};
</script>