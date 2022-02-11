<template>
  <div>
    <QTJournalEditor ref="QTJournalEditorComponent" :entryPassageContents="passageContents" :entryDate="retrievedEntry.date" :entryReference="retrievedEntry.passageReference" :propEntryTitle="retrievedEntry.title" :propEntryThoughts="retrievedEntry.thoughts" :propEntryAppImp="retrievedEntry.applicationImplication"></QTJournalEditor>
    <v-btn class="mr-1" @click="cancel" color="warning">Cancel</v-btn>
    <v-btn class="mr-1" @click="copyContents" color="primary">Share</v-btn>
    <v-dialog v-model="updateDialog" persistent max-width="290" dark>
      <template v-slot:activator="{ on, attrs }">
        <v-btn class="mr-1" v-bind="attrs" v-on="on" color="success">Update</v-btn>
      </template>
      <v-card>
        <v-card-title class="headline">Just to be sure...</v-card-title>
        <v-card-text>Are you sure you would like to update this entry?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="warning" text @click="updateDialog = false">Cancel</v-btn>
          <v-btn color="success" text @click="updateEntry();updateDialog = false;">Yes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" persistent max-width="290" dark>
      <template v-slot:activator="{ on, attrs }">
        <v-btn v-bind="attrs" v-on="on" color="error">Delete</v-btn>
      </template>
      <v-card>
        <v-card-title class="headline">Just to be sure...</v-card-title>
        <v-card-text>Are you sure you would like to delete this entry?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="warning" text @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="success" text @click="deleteEntry()" to="/journalList" nuxt>Yes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack" :timeout="4000" :color="snackColor">
      {{ snackText }}
      <v-btn text @click="snack = false">Close</v-btn>
    </v-snackbar>
  </div>
</template>

<script>
import QTJournalEditor from "@/components/QTJournalEditor";

export default {
  asyncData(context) {
    if (context.store.getters["journalStore/getQTEntriesLength"] === 0) {
      var userID = context.store.getters["userStore/getUserID"];
      return context.app.$axios.$get("/qtJournalEntries", {
        params: {
          creatorEmail: userID,
        },
      }).then((data) => {
        context.store.dispatch("journalStore/storeAllQTEntries", data);
      }).then(() => {
        var entry = context.store.getters["journalStore/getEntryUsingID"](context.route.params.jid);
        return context.app.$axios.$get("/passages", {
          params: {
            passageReference: entry.passageReference,
          },
        }).then((data) => {
          return { passageContents: data.passages[0] };
        })
      }).catch((e) => context.error(e));
    } else {
      var entry = context.store.getters["journalStore/getEntryUsingID"](context.route.params.jid);
      return context.app.$axios.$get("/passages", {
        params: {
          passageReference: entry.passageReference,
        },
      }).then((data) => {
        return { passageContents: data.passages[0] };
      }).catch((e) => context.error(e));
    }
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
      snack: false,
      snackColor: "",
      snackText: ""
    };
  },
  computed: {
    retrievedEntry: function () {
      if (this.$store.getters["journalStore/getEntryUsingID"](this.id) != null) {
        return this.$store.getters["journalStore/getEntryUsingID"](this.id);
      } else {
        // Need this to get out of the component after deletion
        return {
          title: "",
          date: new Date(),
          passageReference: "",
          thoughts: "",
          applicationImplication: "",
        };
      }
    },
  },
  methods: {
    copyContents: function () {
      var entry = this.$refs.QTJournalEditorComponent.getEntry();
      var copyText = entry.passageReference + "\n\nTitle: " + entry.title + "\n\n" + entry.thoughts + "\n\nApplication: " + entry.applicationImplication;
      navigator.clipboard.writeText(copyText).then(() => {
        this.snack = true;
        this.snackColor = "success";
        this.snackText = "Copied to Clipboard";
      });
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
