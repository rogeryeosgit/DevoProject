<template>
  <div>
    <h1>{{ test }}</h1>
    <QTJournalEditor
      :entryDate="retrievedEntry.date"
      :entryReference="retrievedEntry.passageReference"
      :propEntryTitle="retrievedEntry.title"
      :propEntryThoughts="retrievedEntry.thoughts"
      :propEntryAppImp="retrievedEntry.applicationImplication"
    ></QTJournalEditor>
    <!-- :entryPassageContents -->
  </div>
</template>

<script>
import QTJournalEditor from "@/components/QTJournalEditor";

export default {
  middleware: ['loginCheck'],
  components: {
    QTJournalEditor
  },
  data() {
    return {
      id: this.$route.params.jid
    };
  },
    computed: {
    retrievedEntry: function() {
      return this.$store.getters["journalStore/getEntryUsingID"](this.id);
    }
  }
};
</script>