<template>
  <div>
    <h1>Your Journal Entries</h1>
    <center>
      <v-btn to="/journalList/createEntry" nuxt exact color="primary">Write QT Thoughts</v-btn>
    </center>
    <br />
    <JournalCard class="mx-auto" v-for="i in entriesInReverse" :key="i._id" :entryID="i._id" :entryTitle="i.title" :entryDate="i.date" :entryPassageReference="i.passageReference" :entryThoughts="i.thoughts" @view-entry="viewSelectedEntry"></JournalCard>
  </div>
</template>

<script>
import JournalCard from "@/components/JournalCard";

export default {
  asyncData(context) {
    var userID = context.store.getters["userStore/getUserID"];
    return context.app.$axios.$get("/qtJournalEntries", {
      params: {
        creatorEmail: userID,
      },
    }).then((data) => {
      context.store.dispatch("journalStore/storeAllQTEntries", data);
    }).catch((e) => context.error(e));
  },
  middleware: ["checkAuth", "loginCheck"],
  components: {
    JournalCard,
  },
  computed: {
    entriesInReverse: function () {
      var entries = this.$store.getters["journalStore/getAllQTEntries"];
      return entries.slice().reverse();
    },
  },
  methods: {
    viewSelectedEntry(id) {
      this.$router.push("/journalList/" + id);
    },
  },
};
</script>