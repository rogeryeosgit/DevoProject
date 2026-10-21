<template>
  <div>
    <PlanCard
      v-for="i in plans"
      :key="i._id"
      :planID="i._id"
      :planName="i.planName"
      :planDescription="i.description"
      :passages="i.passages"
      :notOwner="!isOwner(i.creatorEmail)"
      :isSelected="checkSelected(i._id)"
      @delete-plan="submitPlanDeletion"
      @update-plan="updateSelectedPlan"
      @selected="changeSelected"
    />
    <div class="d-flex justify-center mt-4">
      <v-btn to="/plansList/createPlan" exact color="primary" variant="elevated">Create Plan</v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['check-auth', 'login-check'] })

const userStore = useUserStore()
const planStore = usePlanStore()
const router = useRouter()

const { error: fetchError } = await useAsyncData('plans-list', async () => {
  const [, data] = await Promise.all([
    planStore.getPlanChosen(),
    authFetch('/api/plans')
  ])
  planStore.storePlans(data)
  return true
})

if (isEmailNotVerifiedError(fetchError.value)) {
  await navigateTo('/auth/verify-email')
} else if (fetchError.value) {
  // data.ref: the failed API call's reference code, shown on error.vue.
  throw createError({ statusCode: 500, statusMessage: 'Failed to load plans', data: { ref: latestErrorRef(fetchError.value) } })
}

const plans = computed(() => planStore.plans)

function submitPlanDeletion(id: string) {
  planStore.deletePlan(id)
}

function updateSelectedPlan(id: string) {
  router.push('/plansList/' + id)
}

function isOwner(ownerEmail: string) {
  return ownerEmail === userStore.userID
}

function checkSelected(id: string) {
  return planStore.chosenPlan === id
}

function changeSelected(id: string) {
  planStore.setChosenPlan(id)
}
</script>
