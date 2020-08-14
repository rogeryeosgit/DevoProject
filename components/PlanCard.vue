<template>
  <div>
    <v-card class="mx-auto" max-width="344">
      <v-card-title>{{ planName }}</v-card-title>
      <v-card-subtitle>{{ planDescription }}</v-card-subtitle>
      <v-card-actions>
        <v-btn :disabled="notOwner" @click="$emit('update-plan', planID)" text>Update</v-btn>
        <v-btn :disabled="notOwner" @click="$emit('delete-plan', planID)" color="red" text>Delete</v-btn>
        <v-chip
          @click="$emit('selected', planID)"
          class="ma-2"
          small
          color="primary"
          :outlined="outlined"
        >{{ chipText }}</v-chip>
        <v-spacer></v-spacer>
        <v-btn icon @click="show = !show">
          <v-icon>{{ show ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </v-btn>
      </v-card-actions>
      <v-expand-transition>
        <div v-show="show">
          <v-divider></v-divider>
          <v-list dense disabled>
            <v-list-item-group v-model="passages" color="primary">
              <v-list-item v-for="(passage, i) in passages" :key="i.toString()">
                <v-list-item-content>
                  <v-list-item-title
                    v-for="(dayPassage, j) in passage"
                    :key="j.toString()"
                    v-text="j + ' ' + i + ' : ' + dayPassage"
                  ></v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </div>
      </v-expand-transition>
    </v-card>
    <br />
  </div>
</template>

<script>
export default {
  props: [
    "planID",
    "planName",
    "planDescription",
    "passages",
    "notOwner",
    "isSelected"
  ],
  data() {
    return {
      show: false
    };
  },
  computed: {
    outlined: function() {
      if (this.isSelected === true) {
        return false;
      } else {
        return true;
      }
    },
    chipText: function() {
      if (this.isSelected === true) {
        return "plan selected";
      } else {
        return "select";
      }
    }
  }
};
</script>

