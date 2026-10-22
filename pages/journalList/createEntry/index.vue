<template>
  <div>
    <QTJournalEditor
      ref="QTJournalEditorComponent"
      :entryPassageContents="getPassageContents"
      :entryDate="date"
      :entryReference="getReference"
      draftKey="qtDraft:create"
      :draftSameDayOnly="true"
      @draft-restored="onDraftRestored"
    />
    <div class="d-flex flex-column flex-sm-row ga-2 mt-4">
      <v-btn color="warning" variant="elevated" @click="cancel">Cancel</v-btn>
      <v-btn color="primary" variant="elevated" @click="copyContents">Share</v-btn>
      <v-btn color="success" variant="elevated" @click="submit">Save</v-btn>
    </div>

    <v-snackbar v-model="snack" :timeout="4000" :color="snackColor">
      {{ snackText }}
      <template v-slot:actions>
        <v-btn v-if="showDiscardDraftButton" variant="text" @click="discardDraftFromSnackbar">Discard</v-btn>
        <v-btn variant="text" @click="snack = false; showDiscardDraftButton = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['check-auth', 'login-check', 'require-verified'] })

const userStore = useUserStore()
const planStore = usePlanStore()
const passageStore = usePassageStore()
const journalStore = useJournalStore()
const router = useRouter()

const QTJournalEditorComponent = ref()

const date = new Date()
const { snack, snackColor, snackText, showSnack } = useSnackbar()
const showDiscardDraftButton = ref(false)

// require-verified (middleware) owns the security gate now - two page-level
// approaches were tried here first (an onMounted probe, then a
// useAsyncData + reactive watch) and both were confirmed unreliable in
// production: navigateTo() called from anywhere in this page's own
// setup/lifecycle did not reliably take effect, letting the page render
// fully anyway. This is back to plain UX polish only - showing the correct
// plan's passage after a refresh - with no security responsibility.
onMounted(async () => {
  try {
    await planStore.getPlanChosen()
    await passageStore.refreshPassage()
  } catch (e) {
    reportClientError('new entry page: loading the chosen plan\'s passage failed', e)
  }
})

const getPassageContents = computed(() => passageStore.todaysPassage)
const getReference = computed(() => passageStore.todaysReference)

function onDraftRestored() {
  showSnack('Restored your unsaved draft', 'info')
  showDiscardDraftButton.value = true
}

function discardDraftFromSnackbar() {
  QTJournalEditorComponent.value.discardDraft()
  snack.value = false
  showDiscardDraftButton.value = false
}

function copyContents() {
  const entry = QTJournalEditorComponent.value.getEntry()
  const copyText = `${entry.passageReference}\n\nTitle: ${entry.title}\n\n${entry.thoughts}\n\nApplication: ${entry.applicationImplication}`
  navigator.clipboard.writeText(copyText).then(() => {
    showDiscardDraftButton.value = false
    showSnack('Copied to Clipboard', 'success')
  })
}

async function submit() {
  const valid = await QTJournalEditorComponent.value.checkValidation()
  if (!valid) return

  const entry = QTJournalEditorComponent.value.getEntry()
  const ok = await journalStore.createEntry({
    creatorEmail: userStore.userID,
    date,
    passageReference: getReference.value,
    title: entry.title,
    thoughts: entry.thoughts,
    applicationImplication: entry.applicationImplication
  })

  if (ok) {
    QTJournalEditorComponent.value.clearDraft()
    router.push('/journalList')
  } else {
    showDiscardDraftButton.value = false
    showSnack(withErrorRef("Couldn't save your entry — your draft is safe, please try again."), 'error')
  }
}

function cancel() {
  QTJournalEditorComponent.value.clearDraft()
  router.push('/journalList')
}
</script>
