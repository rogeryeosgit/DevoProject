<template>
  <v-form ref="QTJournalEditorForm">
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
              <v-text-field v-model="entryTitle" label="Title" :rules="titleRules" required></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-textarea
                solo
                counter
                v-model="entryThoughts"
                label="This part of the passage tells me that..."
                :rules="thoughtsRules"
              ></v-textarea>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-text-field
                v-model="entryAppImp"
                label="Application / Implication"
                :rules="appImpRules"
                required
              ></v-text-field>
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
      titleRules: [(v) => !!v || "Please enter a title for your entry."],
      thoughtsRules: [(v) => !!v || "Please journal down some thoughts"],
      appImpRules: [
        (v) => !!v || "Please fill in an application for your life",
      ],
    };
  },
  methods: {
    getEntry: function () {
      return {
        title: this.entryTitle,
        thoughts: this.entryThoughts,
        applicationImplication: this.entryAppImp,
      };
    },
    checkValidation: function() {
      return this.$refs.QTJournalEditorForm.validate();
    }
  },
};
</script>

