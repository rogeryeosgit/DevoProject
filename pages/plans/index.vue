<template>
  <div>
    <h1>Everything about plans here</h1>
    <v-btn to="/plans/createPlan" nuxt exact color="primary">Create Plan</v-btn>
    <!-- <v-btn @click='createPlan' color="primary">Create Plan</v-btn> -->
  </div>
</template>

<script>
export default {
  middleware: ["loginCheck"],
  methods: {
    createPlan() {
      this.$store.dispatch("planStore/createPlan");
      this.$router.push("/");
    }
  }
};
</script>