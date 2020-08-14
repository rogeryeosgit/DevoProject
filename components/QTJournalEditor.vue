<template>
  <v-form v-model="valid">
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="8">
          <Passage
            :passageDate="entryDate"
            :passageContents="entryPassageContents"
            :reference="entryReference"
          ></Passage>
        </v-col>
        <v-col>
          <v-row>
            <v-col>
              <v-text-field v-model="entryTitle" :counter="20" label="Title" required></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-textarea
                auto-grow
                solo
                v-model="entryThoughts"
                label="This part of the passage tells me that..."
              ></v-textarea>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-text-field
                v-model="entryAppImp"
                label="Application / Implication"
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
export default {
  props: [
    "entryDate",
    "entryPassageContents",
    "entryReference",
    "propEntryTitle",
    "propEntryThoughts",
    "propEntryAppImp"
  ],
  data() {
    return {
      entryTitle: this.propEntryTitle || "",
      entryThoughts: this.propEntryThoughts || "",
      entryAppImp: this.propEntryAppImp || ""
    };
  },
  computed: {
  }
};
</script>

