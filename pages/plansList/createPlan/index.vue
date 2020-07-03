<template>
  <div>
    <PlanEditor ref="planEditorComponent"></PlanEditor>
    <br />
    <v-btn @click="cancelPlan" color="error">Cancel</v-btn>
    <v-btn @click="submitPlan" color="success">Create Plan</v-btn>
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
    submitPlan() {
      var p = this.$refs.planEditorComponent.getPlan();

      // for (let [key, value] of Object.entries(p.passages)) {
      //   console.log(`${key}:`);
      //   for (let [key2, value2] of Object.entries(p.passages[key])) {
      //     console.log(`${key2}: ${value2}`);
      //   }
      // }

      this.$store.dispatch("planStore/createPlan", {
        creatorEmail: p.creatorEmail,
        planName: p.planName,
        description: p.description,
        passages: p.passages
      });
      this.$router.push("/plansList");
    },
    cancelPlan() {
      this.$router.push("/plansList");
    },
  }
};
</script>