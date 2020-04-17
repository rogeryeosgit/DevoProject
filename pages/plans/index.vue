<template>
  <div>
    <h1>Everything about plans here</h1>
    <v-btn to="/plans/createPlan" nuxt exact color="primary">Create Plan</v-btn>
  </div>
</template>

<script>
export default {
  middleware: ["loginCheck"],
};
</script>