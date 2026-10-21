<template>
  <div>
    <h1 class="mb-4">Your Journal Entries</h1>
    <StreakCard class="mx-auto mb-4" />
    <div class="d-flex justify-center mb-4">
      <v-btn to="/journalList/createEntry" exact color="primary" variant="elevated">Write QT Thoughts</v-btn>
    </div>
    <JournalCard
      v-for="i in journalStore.qtEntries"
      :key="i._id"
      :entryID="i._id"
      :entryTitle="i.title"
      :entryDate="i.date"
      :entryPassageReference="i.passageReference"
      :entryThoughts="i.thoughts"
      @view-entry="viewSelectedEntry"
    />
    <div v-if="journalStore.hasMoreEntries" v-intersect="onIntersect" class="d-flex justify-center mt-4">
      <v-progress-circular indeterminate color="primary" />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['check-auth', 'login-check'] })

const userStore = useUserStore()
const journalStore = useJournalStore()
const router = useRouter()

// First page and the streak's dates fetch are independent - run them
// concurrently rather than one waterfalled after the other.
const { error: fetchError } = await useAsyncData('journal-list-entries', async () => {
  const [{ entries, hasMore }] = await Promise.all([
    authFetch('/api/qtJournalEntries', { params: { creatorEmail: userStore.userID } }),
    journalStore.fetchEntryDates()
  ])
  journalStore.storeFirstPage(entries, hasMore)
  return true
})

if (isEmailNotVerifiedError(fetchError.value)) {
  await navigateTo('/auth/verify-email')
} else if (fetchError.value) {
  // data.ref: the failed API call's reference code, shown on error.vue.
  throw createError({ statusCode: 500, statusMessage: 'Failed to load journal entries', data: { ref: latestErrorRef(fetchError.value) } })
}

let loadingMore = false

// Fires whenever the sentinel below the list scrolls into view. Guarded on
// loadingMore so a fast scroll (or the sentinel already being on-screen for a
// short first page) doesn't fire overlapping loadMore() calls; the sentinel
// itself is removed via v-if once hasMoreEntries goes false.
async function onIntersect(isIntersecting: boolean) {
  if (!isIntersecting || loadingMore || !journalStore.hasMoreEntries) return
  loadingMore = true
  try {
    await journalStore.loadMore()
  } finally {
    loadingMore = false
  }
}

function viewSelectedEntry(id: string) {
  router.push('/journalList/' + id)
}
</script>
