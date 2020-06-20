<template>
  <div>
    <PlanCard
      v-for="i in plans"
      :key="i._id"
      :planID="i._id"
      :planName="i.planName"
      :planDescription="i.description"
      :passages="i.passages"
      @deletePlan="submitPlanDeletion"
    ></PlanCard>
    <br />
    <v-btn to="/plansList/createPlan" nuxt exact color="primary">Create Plan</v-btn>
  </div>
</template>

<script>
import PlanCard from "@/components/PlanCard";

export default {
  asyncData(context) {
    return context.app.$axios
      .$get("/plans")
      .then(data => {
        context.store.dispatch("planStore/storePlans", data);
      })
      .catch(e => context.error(e));
  },
  components: {
    PlanCard
  },
  middleware: ["checkAuth", "loginCheck"],
  computed: {
    plans: function() {
      return this.$store.getters["planStore/getPlans"];
    }
  },
  methods: {
    submitPlanDeletion(id) {
      this.$store.dispatch("planStore/deletePlan", id);
    }
  }
};
</script>


