<template>
  <div>
    <PlanEditor
      :propPlanName="retrievedPlan.planName"
      :propDescription="retrievedPlan.description"
      :propTempStore="retrievedPlan.passages"
    ></PlanEditor>
    <br />
    <v-btn @click="cancelPlan" color="error">Cancel</v-btn>
    <v-btn @click="updatePlan" color="success">Update Plan</v-btn>
  </div>
</template>

<script>
import PlanEditor from "@/components/PlanEditor";

export default {
  middleware: ["checkAuth", "loginCheck"],
  data() {
    return {
      id: this.$route.params.pid
    };
  },
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
  },
  computed: {
    retrievedPlan: function() {
      return this.$store.getters["planStore/getPlanUsingID"](this.id);
    }
  }
};
</script>