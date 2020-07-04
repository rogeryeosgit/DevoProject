<template>
  <div>
    <Passage :passageDate="date" :passageContents="getPassageContents" :reference="getReference"></Passage>
    <v-form v-model="valid">
      <v-container>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="firstname"
              :rules="nameRules"
              :counter="10"
              label="First name"
              required
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="lastname"
              :rules="nameRules"
              :counter="10"
              label="Last name"
              required
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field v-model="email" :rules="emailRules" label="E-mail" required></v-text-field>
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
      firstname: "",
      lastname: "",
      nameRules: [
        v => !!v || "Name is required",
        v => v.length <= 10 || "Name must be less than 10 characters"
      ],
      email: "",
      emailRules: [
        v => !!v || "E-mail is required",
        v => /.+@.+/.test(v) || "E-mail must be valid"
      ]
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