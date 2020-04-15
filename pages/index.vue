<template>
  <div>
    <v-card class="mx-auto" max-width="75%" outlined>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="headline mb-1 text-wrap">Your Personal QT and Journaling App</v-list-item-title>
          <v-list-item-subtitle class="text--primary text-wrap">Practice PRESS in building your Quiet Time habits! This app aims to help you build a habit of journaling your QT thoughts. Bible passages change every day.<br><br>P - Pray<br>R - Read the Passage<br>E - Examine your own life<br>S - Say it back to God<br>S - Share it with another</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-card>
    <br>
    <Passage :passageDate = "date">
    </Passage>
  </div>
</template>

<script>
import Passage from "@/components/Passage";

export default {
 data() {
    return {
      date: new Date()
    };
  },
  components: {
    Passage
  },
  middleware: ['checkAuth']
};
</script>
