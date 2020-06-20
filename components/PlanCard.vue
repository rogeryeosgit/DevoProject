<template>
  <div>
    <v-card class="mx-auto" max-width="344">
      <v-card-title>{{ planName }}</v-card-title>
      <v-card-subtitle>{{ planDescription }}</v-card-subtitle>
      <v-card-actions>
        <v-btn text>Update</v-btn>
        <v-btn @click="$emit('deletePlan', planID)" color="red" text>Delete</v-btn>
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
  props: ["planID", "planName", "planDescription", "passages"],
  data() {
    return {
      show: false
    };
  }
};
</script>

<style>
</style>