<template>
  <div>
    <PlanEditor ref="PlanEditorComponent" />
    <div class="d-flex flex-column flex-sm-row ga-2 mt-4">
      <v-btn color="warning" variant="elevated" @click="cancelPlan">Cancel</v-btn>
      <v-btn color="success" variant="elevated" @click="submitPlan">Create Plan</v-btn>
    </div>
    <v-snackbar v-model="snack" :timeout="4000" :color="snackColor">
      {{ snackText }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snack = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['check-auth', 'login-check', 'require-verified'] })

const planStore = usePlanStore()
const router = useRouter()

const PlanEditorComponent = ref()
const { snack, snackColor, snackText, showSnack } = useSnackbar()

async function submitPlan() {
  const valid = await PlanEditorComponent.value.checkValidation()
  if (!valid) return

  const p = PlanEditorComponent.value.getPlan()
  const ok = await planStore.createPlan({
    creatorEmail: p.creatorEmail,
    planName: p.planName,
    description: p.description,
    passages: p.passages
  })
  if (ok) {
    router.push('/plansList')
  } else {
    // Stay on the page so nothing typed into the editor is lost.
    showSnack(withErrorRef("Couldn't create your plan - please try again."), 'error')
  }
}

function cancelPlan() {
  router.push('/plansList')
}
</script>
