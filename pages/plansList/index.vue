<template>
  <div>
    <PlanCard class="mx-auto" v-for="i in plans" :key="i._id" :planID="i._id" :planName="i.planName" :planDescription="i.description" :passages="i.passages" :notOwner="!isOwner(i.creatorEmail)" @delete-plan="submitPlanDeletion" @update-plan="updateSelectedPlan" :isSelected="checkSelected(i._id)" @selected="changeSelected" :ref="i._id" :selectedLater="false"></PlanCard>
    <center>
      <v-btn to="/plansList/createPlan" nuxt exact color="primary">Create Plan</v-btn>
    </center>
  </div>
</template>

<script>
import PlanCard from "@/components/PlanCard";

export default {
  asyncData(context) {
    context.store.dispatch("planStore/getPlanChosen");
    return context.app.$axios.$get("/plans").then((data) => {
        context.store.dispatch("planStore/storePlans", data);
    }).catch((e) => context.error(e));
  },
  components: {
    PlanCard,
  },
  middleware: ["checkAuth", "loginCheck"],
  computed: {
    plans: function () {
      return this.$store.getters["planStore/getPlans"];
    },
  },
  methods: {
    submitPlanDeletion(id) {
      this.$store.dispatch("planStore/deletePlan", id);
    },
    updateSelectedPlan(id) {
      this.$router.push("/plansList/" + id);
    },
    isOwner(ownerEmail) {
      var currentUserID = this.$store.getters["userStore/getUserID"];
      if (ownerEmail === currentUserID) {
        return true;
      } else {
        return false;
      }
    },
    checkSelected(id) {
      var selectedPlanID = this.$store.getters["planStore/getChosenPlan"];
      if (selectedPlanID === id) {
        return true;
      } else {
        return false;
      }
    },
    changeSelected(id) {
      this.$store.dispatch("planStore/setChosenPlan", id);
    },
  }
};
</script>

<style scoped>
.plan-card {
  margin: 10px;
}

.planslist-page {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}
</style>

