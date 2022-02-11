<template>
  <div>
    <PlanEditor :propPlanName="retrievedPlan.planName" :propDescription="retrievedPlan.description" :propTempStore="retrievedPlan.passages" ref="PlanEditorComponent"></PlanEditor>
    <br />
    <v-btn class="mr-1" @click="cancelPlan" color="warning">Cancel</v-btn>

    <v-dialog v-model="updateDialog" persistent max-width="290" dark>
      <template v-slot:activator="{ on, attrs }">
        <v-btn v-bind="attrs" v-on="on" color="success">Update Plan</v-btn>
      </template>
      <v-card>
        <v-card-title class="headline">Just to be sure...</v-card-title>
        <v-card-text>Are you sure you would like to update this plan?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="warning" text @click="updateDialog = false">Cancel</v-btn>
          <v-btn color="success" text @click="updatePlan(); updateDialog = false">Yes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import PlanEditor from "@/components/PlanEditor";

export default {
  asyncData(context) {
    if (context.store.getters["planStore/getPlansSize"] === 0) {
      return context.app.$axios.$get("/plans").then((data) => {
        context.store.dispatch("planStore/storePlans", data);
      }).catch((e) => context.error(e));
    }
  },
  middleware: ["checkAuth", "loginCheck"],
  data() {
    return {
      id: this.$route.params.pid,
      updateDialog: false
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