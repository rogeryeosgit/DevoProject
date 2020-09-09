<template>
  <div>
    <QTJournalEditor
      ref="QTJournalEditorComponent"
      :entryPassageContents="getPassageContents"
      :entryDate="date"
      :entryReference="getReference"
    ></QTJournalEditor>
    <v-btn @click="cancel" color="warning">Cancel</v-btn>
    <v-btn @click="submit" color="success">Save</v-btn>
  </div>
</template>

<script>
import QTJournalEditor from "@/components/QTJournalEditor";

export default {
  middleware: ["checkAuth", "loginCheck"],
  components: {
    QTJournalEditor,
  },
  data() {
    return {
      date: new Date(),
    };
  },
  methods: {
    submit: function () {
      var userID = this.$store.getters["userStore/getUserID"];
      var entry = this.$refs.QTJournalEditorComponent.getEntry();

      this.$store.dispatch("journalStore/createEntry", {
        creatorEmail: userID,
        date: this.date,
        passageReference: this.getReference,
        title: entry.title,
        thoughts: entry.thoughts,
        applicationImplication: entry.applicationImplication,
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