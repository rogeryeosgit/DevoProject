<template>
  <div>
    <QTJournalEditor
      ref="QTJournalEditorComponent"
      :entryPassageContents="passageContents"
      :entryDate="retrievedEntry.date"
      :entryReference="retrievedEntry.passageReference"
      :propEntryTitle="retrievedEntry.title"
      :propEntryThoughts="retrievedEntry.thoughts"
      :propEntryAppImp="retrievedEntry.applicationImplication"
    ></QTJournalEditor>
    <v-btn @click="cancel" color="warning">Cancel</v-btn>
    <v-btn @click="updateEntry" color="success">Update</v-btn>
    <v-btn @click="deleteEntry" color="error" to="/journalList" nuxt>Delete</v-btn>
  </div>
</template>

<script>
import QTJournalEditor from "@/components/QTJournalEditor";

export default {
  asyncData(context) {
    var entry = context.store.getters["journalStore/getEntryUsingID"](
      context.route.params.jid
    );
    return context.app.$axios
      .$get("/passages", {
        params: {
          passageReference: entry.passageReference,
        },
      })
      .then((data) => {
        return { passageContents: data.passages[0] };
      })
      .catch((e) => context.error(e));
  },
  middleware: ["checkAuth", "loginCheck"],
  components: {
    QTJournalEditor,
  },
  data() {
    return {
      id: this.$route.params.jid,
    };
  },
  computed: {
    retrievedEntry: function () {
      return this.$store.getters["journalStore/getEntryUsingID"](this.id);
    },
  },
  methods: {
    cancel: function () {
      this.$router.push("/journalList");
    },
    updateEntry: function () {
      var entry = this.$refs.QTJournalEditorComponent.getEntry();

      this.$store.dispatch("journalStore/updateEntry", {
        journalID: this.id,
        title: entry.title,
        thoughts: entry.thoughts,
        applicationImplication: entry.applicationImplication,
      });
      this.$router.push("/journalList");
    },
    deleteEntry: function () {
      this.$store.dispatch("journalStore/deleteEntry", this.id);
    },
  }
};
</script>