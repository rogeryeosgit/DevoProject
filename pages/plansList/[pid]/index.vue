<template>
  <div>
    <PlanEditor
      ref="PlanEditorComponent"
      :propPlanName="retrievedPlan?.planName"
      :propDescription="retrievedPlan?.description"
      :propTempStore="retrievedPlan?.passages"
    />
    <div class="d-flex flex-column flex-sm-row ga-2 mt-4">
      <v-btn color="warning" variant="elevated" @click="cancelPlan">Cancel</v-btn>

      <v-dialog v-model="updateDialog" persistent max-width="290">
        <template v-slot:activator="{ props: activatorProps }">
          <v-btn color="success" variant="elevated" v-bind="activatorProps">Update Plan</v-btn>
        </template>
        <v-card>
          <v-card-title class="text-h5">Just to be sure...</v-card-title>
          <v-card-text>Are you sure you would like to update this plan?</v-card-text>
          <v-card-actions class="flex-wrap justify-end">
            <v-btn color="warning" variant="text" @click="updateDialog = false">Cancel</v-btn>
            <v-btn color="success" variant="text" @click="updatePlan(); updateDialog = false">Yes</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['check-auth', 'login-check'] })

const route = useRoute()
const router = useRouter()
const planStore = usePlanStore()
const passageStore = usePassageStore()

const id = route.params.pid as string
const updateDialog = ref(false)
const PlanEditorComponent = ref()

// Fetches this one plan directly (with its full passages) rather than relying
// on the plans-list store, which only ever carries the trimmed list-view
// projection (no passages - see server/api/plans/index.get.ts).
const { data: retrievedPlan, error: fetchError } = await useAsyncData(`plan-edit-${id}`, () =>
  authFetch(`/api/plans/${id}`)
)
if (isEmailNotVerifiedError(fetchError.value)) {
  await navigateTo('/auth/verify-email')
} else if (fetchError.value) {
  // data.ref: the failed API call's reference code, shown on error.vue.
  throw createError({ statusCode: 500, statusMessage: 'Failed to load plan', data: { ref: latestErrorRef(fetchError.value) } })
}

async function updatePlan() {
  const valid = await PlanEditorComponent.value.checkValidation()
  if (!valid) return

  const p = PlanEditorComponent.value.getPlan()
  await planStore.updatePlan({
    _id: id,
    creatorEmail: p.creatorEmail,
    planName: p.planName,
    description: p.description,
    passages: p.passages
  })
  await passageStore.refreshPassage()
  router.push('/plansList')
}

function cancelPlan() {
  router.push('/plansList')
}
</script>
