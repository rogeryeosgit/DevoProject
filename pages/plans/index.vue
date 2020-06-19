<template>
  <div>
    <PlanCard v-for="i in plans" :key="i" :planName="i.planName" :planDescription="i.planDescription" :passages="i.plans"></PlanCard>
    <br />
    <v-btn to="/plans/createPlan" nuxt exact color="primary">Create Plan</v-btn>
  </div>
</template>

<script>
import PlanCard from "@/components/PlanCard";

export default {
  // async asyncData ({ params }) {
  //   const { data } = await axios.get(`https://my-api/posts/${params.id}`)
  //   return { title: data.title }
  // },
  components: {
    PlanCard
  },
  data() {
    return {
      plans: []
    };
  },
  middleware: ["checkAuth", "loginCheck"],
  methods: {
    createPlan() {
      this.$store.dispatch("planStore/createPlan");
      this.$router.push("/");
    }
  }
};
</script>


