<template>
  <div>
    <h1>list of journal entries</h1>
    <v-btn to="/journalList/createEntry" nuxt exact color="primary">Write QT Thoughts</v-btn>
  </div>
</template>

<script>
export default {
  asyncData(context) {
    var userID = context.store.getters["userStore/getUserID"];
    return context.app.$axios
      .$get("/qtEntries", {
        params: {
          creatorEmail: userID,
        },
      })
      .then((data) => {
        context.store.dispatch("journalStore/storeAllQTEntries", data);
      })
      .catch((e) => context.error(e));
  },
  middleware: ["checkAuth", "loginCheck"],
  computed: {
    entries: function () {
      return this.$store.getters["journalStore/getAllQTEntries"];
    },
  },
};
</script>