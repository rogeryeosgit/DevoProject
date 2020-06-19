<template>
  <v-card class="mx-auto" max-width="344">
    <v-card-title>{{ planName }}</v-card-title>
    <v-card-subtitle>{{ planDescription }}</v-card-subtitle>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn icon @click="show = !show">
        <v-icon>{{ show ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
      </v-btn>
    </v-card-actions>
    <v-expand-transition>
      <div v-show="show">
        <v-divider></v-divider>
        <v-list dense>
          <v-list-item-group v-model="passages" color="primary">
            <v-list-item v-for="i in passages" :key="i">
              <v-list-item-content>
                <v-list-item-title v-text="i"></v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script>
export default {
  props: ["planName", "planDescription", "passages"],
  data() {
    return {
      show: false
    };
  }
};
</script>

<style>
</style>