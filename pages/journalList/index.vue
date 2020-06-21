<template>
  <div>
    <h1>list of journal entries</h1>
    <v-btn to="/journalList/createEntry" nuxt exact color="primary">Write QT Thoughts</v-btn>
  </div>
</template>

<script>
export default {
  middleware: ["checkAuth", "loginCheck"]
};
</script>