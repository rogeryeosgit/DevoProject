<template>
  <div>
    <!-- <h1>Details about plan {{ $route.params.pid }} here</h1> -->
    <PlanEditor></PlanEditor>
    <br />
    <v-btn @click="cancelPlan" color="error">Cancel</v-btn>
    <v-btn @click="updatePlan" color="success">Update Plan</v-btn>
  </div>
</template>

<script>
import PlanEditor from "@/components/PlanEditor";

export default {
  middleware: ["checkAuth", "loginCheck"],
  components: {
    PlanEditor
  },
  methods: {
    updatePlan() {
      this.$router.push("/plansList");
    },
    cancelPlan() {
      this.$router.push("/plansList");
    }
  }
};
</script>