<template>
  <div>
    <PlanEditor
      :propPlanName="retrievedPlan.planName"
      :propDescription="retrievedPlan.description"
      :propTempStore="retrievedPlan.passages"
      ref="PlanEditorComponent"
    ></PlanEditor>
    <br />
    <v-btn class="mr-1" @click="cancelPlan" color="warning">Cancel</v-btn>
    <v-btn @click="updatePlan" color="success">Update Plan</v-btn>
  </div>
</template>

<script>
import PlanEditor from "@/components/PlanEditor";

export default {
  middleware: ["checkAuth", "loginCheck"],
  data() {
    return {
      id: this.$route.params.pid,
    };
  },
  components: {
    PlanEditor,
  },
  methods: {
    updatePlan() {
      if (this.$refs.PlanEditorComponent.checkValidation()) {
        var p = this.$refs.PlanEditorComponent.getPlan();

        this.$store.dispatch("planStore/updatePlan", {
          _id: this.id,
          creatorEmail: p.creatorEmail,
          planName: p.planName,
          description: p.description,
          passages: p.passages,
        });
        this.$store.dispatch("passageStore/refreshPassage");
        this.$router.push("/plansList");
      }
    },
    cancelPlan() {
      this.$router.push("/plansList");
    },
  },
  computed: {
    retrievedPlan: function () {
      return this.$store.getters["planStore/getPlanUsingID"](this.id);
    },
  },
};
</script>