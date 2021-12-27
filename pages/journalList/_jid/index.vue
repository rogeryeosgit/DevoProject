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
    <v-btn class="mr-1" @click="copyContents" color="warning">Copy</v-btn>
    <v-btn class="mr-1" @click="cancel" color="warning">Cancel</v-btn>

    <v-dialog v-model="updateDialog" persistent max-width="290" dark>
      <template v-slot:activator="{ on, attrs }">
        <v-btn class="mr-1" v-bind="attrs" v-on="on" color="success"
          >Update</v-btn
        >
      </template>
      <v-card>
        <v-card-title class="headline">Just to be sure...</v-card-title>
        <v-card-text
          >Are you sure you would like to update this entry?</v-card-text
        >
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="warning" text @click="updateDialog = false"
            >Cancel</v-btn
          >
          <v-btn
            color="success"
            text
            @click="
              updateEntry();
              updateDialog = false;
            "
            >Yes</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" persistent max-width="290" dark>
      <template v-slot:activator="{ on, attrs }">
        <v-btn v-bind="attrs" v-on="on" color="error">Delete</v-btn>
      </template>
      <v-card>
        <v-card-title class="headline">Just to be sure...</v-card-title>
        <v-card-text
          >Are you sure you would like to delete this entry?</v-card-text
        >
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="warning" text @click="deleteDialog = false"
            >Cancel</v-btn
          >
          <v-btn
            color="success"
            text
            @click="deleteEntry()"
            to="/journalList"
            nuxt
            >Yes</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
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
      updateDialog: false,
      deleteDialog: false,
    };
  },
  computed: {
    retrievedEntry: function () {
      return this.$store.getters["journalStore/getEntryUsingID"](this.id);
    },
  },
  methods: {
    copyContents: function () {
      navigator.clipboard.writeText("<empty clipboard>").then(
        function () {
          console.log("Test");
        },
        function () {
          console.log("Nope!");
        }
      );
    },
    cancel: function () {
      this.$router.push("/journalList");
    },
    updateEntry: function () {
      if (this.$refs.QTJournalEditorComponent.checkValidation()) {
        var entry = this.$refs.QTJournalEditorComponent.getEntry();

        this.$store.dispatch("journalStore/updateEntry", {
          journalID: this.id,
          title: entry.title,
          thoughts: entry.thoughts,
          applicationImplication: entry.applicationImplication,
        });
        this.$router.push("/journalList");
      }
    },
    deleteEntry: function () {
      this.$store.dispatch("journalStore/deleteEntry", this.id);
    },
  },
};
</script>
