<template>
  <v-form>
    <v-container class="pa-0">
      <v-row justify="center">
        <v-col cols="12" md="7">
          <Passage
            :passageDate="entryDate"
            :passageContents="entryPassageContents"
            :reference="entryReference"
          ></Passage>
        </v-col>
        <v-col>
          <v-row>
            <v-col>
              <v-text-field v-model="entryTitle" label="Title" required></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-textarea
                auto-grow
                solo
                counter
                v-model="entryThoughts"
                label="This part of the passage tells me that..."
              ></v-textarea>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-text-field v-model="entryAppImp" label="Application / Implication" required></v-text-field>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>

<script>
import Passage from "@/components/Passage";

export default {
  props: [
    "entryDate",
    "entryPassageContents",
    "entryReference",
    "propEntryTitle",
    "propEntryThoughts",
    "propEntryAppImp",
  ],
  components: {
    Passage,
  },
  data() {
    return {
      entryTitle: this.propEntryTitle || "",
      entryThoughts: this.propEntryThoughts || "",
      entryAppImp: this.propEntryAppImp || "",
    };
  },
  methods: {
    getEntry: function () {
      return {
        title: this.entryTitle,
        thoughts: this.entryThoughts,
        applicationImplication: this.entryAppImp
      };
    },
  },
};
</script>

