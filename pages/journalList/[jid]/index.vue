<template>
  <div>
    <QTJournalEditor
      ref="QTJournalEditorComponent"
      :entryPassageContents="passageContents"
      :entryDate="retrievedEntry.date"
      :entryReference="retrievedEntry.passageReference"
      :propEntryTitle="retrievedEntry.title"
      :propEntryThoughts="retrievedEntry.thoughts"
      :propEntryAppImp="retrievedEntry.applicationImplication"
      :draftKey="'qtDraft:edit:' + id"
      @draft-restored="onDraftRestored"
    />
    <div class="d-flex flex-column flex-sm-row ga-2 mt-4">
      <v-btn color="warning" variant="elevated" @click="cancel">Cancel</v-btn>
      <v-btn color="primary" variant="elevated" @click="copyContents">Share</v-btn>
      <v-dialog v-model="updateDialog" persistent max-width="290">
        <template v-slot:activator="{ props: activatorProps }">
          <v-btn color="success" variant="elevated" v-bind="activatorProps">Update</v-btn>
        </template>
        <v-card>
          <v-card-title class="text-h5">Just to be sure...</v-card-title>
          <v-card-text>Are you sure you would like to update this entry?</v-card-text>
          <v-card-actions class="flex-wrap justify-end">
            <v-btn color="warning" variant="text" @click="updateDialog = false">Cancel</v-btn>
            <v-btn color="success" variant="text" @click="updateEntry(); updateDialog = false">Yes</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="deleteDialog" persistent max-width="290">
        <template v-slot:activator="{ props: activatorProps }">
          <v-btn color="error" variant="elevated" v-bind="activatorProps">Delete</v-btn>
        </template>
        <v-card>
          <v-card-title class="text-h5">Just to be sure...</v-card-title>
          <v-card-text>Are you sure you would like to delete this entry?</v-card-text>
          <v-card-actions class="flex-wrap justify-end">
            <v-btn color="warning" variant="text" @click="deleteDialog = false">Cancel</v-btn>
            <v-btn color="success" variant="text" @click="deleteEntry()">Yes</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
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
definePageMeta({ middleware: ['check-auth', 'login-check'] })

const route = useRoute()
const router = useRouter()
const journalStore = useJournalStore()

const id = route.params.jid as string

const QTJournalEditorComponent = ref()
const updateDialog = ref(false)
const deleteDialog = ref(false)
const { snack, snackColor, snackText, showSnack } = useSnackbar()
const showDiscardDraftButton = ref(false)

const { data: passageData, error: fetchError } = await useAsyncData(`journal-entry-${id}`, async () => {
  const entry = await authFetch(`/api/qtJournalEntries/${id}`)
  journalStore.upsertEntry(entry)

  const data: any = await authFetch('/api/passages', {
    params: { passageReference: entry.passageReference }
  })
  return data.passages[0]
})

if (isEmailNotVerifiedError(fetchError.value)) {
  await navigateTo('/auth/verify-email')
} else if (fetchError.value) {
  // data.ref: the failed API call's reference code, shown on error.vue.
  throw createError({ statusCode: 500, statusMessage: 'Failed to load journal entry', data: { ref: latestErrorRef(fetchError.value) } })
}

const passageContents = computed(() => passageData.value)

const retrievedEntry = computed(() => {
  const entry = journalStore.getEntryUsingID(id)
  if (entry != null) {
    return entry
  }
  // Need this to get out of the component after deletion
  return {
    title: '',
    date: new Date(),
    passageReference: '',
    thoughts: '',
    applicationImplication: ''
  }
})

// Fires only on in-app navigation away from this route (Cancel, a successful
// Update, Delete, clicking elsewhere in the nav) - NOT on a hard refresh or
// tab close, since those tear the page down entirely rather than going
// through vue-router. So: deliberately leaving always discards the draft (the
// next visit shows the official saved entry), while an accidental
// refresh/close still recovers it, since the draft was never cleared in that
// case.
onBeforeRouteLeave(() => {
  QTJournalEditorComponent.value?.clearDraft()
})

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

function cancel() {
  router.push('/journalList')
}

async function updateEntry() {
  const valid = await QTJournalEditorComponent.value.checkValidation()
  if (!valid) return

  const entry = QTJournalEditorComponent.value.getEntry()
  const ok = await journalStore.updateEntry({
    journalID: id,
    title: entry.title,
    thoughts: entry.thoughts,
    applicationImplication: entry.applicationImplication
  })

  if (ok) {
    router.push('/journalList')
  } else {
    showDiscardDraftButton.value = false
    showSnack(withErrorRef("Couldn't save your changes — your draft is safe, please try again."), 'error')
  }
}

// Not a link to /journalList any more: that navigated away before the
// delete finished, so a failed delete looked exactly like a successful one.
async function deleteEntry() {
  deleteDialog.value = false
  const ok = await journalStore.deleteEntry(id)
  if (ok) {
    router.push('/journalList')
  } else {
    showDiscardDraftButton.value = false
    showSnack(withErrorRef("Couldn't delete this entry - please try again."), 'error')
  }
}
</script>
