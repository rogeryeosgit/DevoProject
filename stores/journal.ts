// Normalize any date (Date object, ISO string, etc.) to a DST-safe integer day
// index based on the *local* calendar day, so consecutive days always differ
// by exactly 1 regardless of daylight-saving shifts.
export function toDayIndex(input: string | Date): number {
  const d = new Date(input)
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000)
}

function uniqueSortedDays(dates: (string | Date)[]): number[] {
  return [...new Set(dates.map((d) => toDayIndex(d)))].sort((a, b) => a - b)
}

const DEFAULT_PAGE_SIZE = 20

export const useJournalStore = defineStore('journal', {
  state: () => ({
    qtEntries: [] as any[],
    // Dates-only mirror of every entry the user has ever written, independent of
    // qtEntries' pagination - streaks need every day, not just the loaded page.
    entryDates: [] as (string | Date)[],
    hasMoreEntries: true,
    // The visitor's current calendar day, read reactively by the streak
    // getters below instead of each calling `new Date()` inline (a Pinia
    // getter is a computed - the wall clock isn't a reactive dependency, so
    // an inline read can never invalidate it; only reassigning this field
    // can). Initialized once at store creation, which during SSR runs
    // against the *server's* clock - same wrinkle as passageStore.passageDay
    // (stores/passage.ts:7-13) - so it hydrates client-side already
    // possibly one day off for a visitor outside the server's timezone.
    // touchToday() is the one-time post-hydration reconcile for that;
    // StreakCard.vue calls it on mount so every host page gets it for free.
    todayIndex: toDayIndex(new Date())
  }),

  getters: {
    getAllQTEntries: (state) => state.qtEntries,
    getEntryUsingID: (state) => (id: string) => state.qtEntries.find((e: any) => e._id === id),
    getQTEntriesLength: (state) => state.qtEntries.length,

    // Computed once per entryDates change (Pinia caches each getter independently),
    // then reused by all three streak getters below instead of each recomputing
    // uniqueSortedDays from scratch.
    sortedEntryDayIndexes: (state) => uniqueSortedDays(state.entryDates),

    getCurrentStreak(): number {
      const days = this.sortedEntryDayIndexes
      if (days.length === 0) return 0

      const today = this.todayIndex
      const mostRecent = days[days.length - 1]!

      // Streak is broken if the most recent entry is older than yesterday.
      if (today - mostRecent > 1) return 0

      let streak = 1
      for (let i = days.length - 1; i > 0; i--) {
        if (days[i]! - days[i - 1]! === 1) {
          streak++
        } else {
          break
        }
      }
      return streak
    },

    getLongestStreak(): number {
      const days = this.sortedEntryDayIndexes
      if (days.length === 0) return 0

      let longest = 1
      let current = 1
      for (let i = 1; i < days.length; i++) {
        if (days[i]! - days[i - 1]! === 1) {
          current++
          longest = Math.max(longest, current)
        } else {
          current = 1
        }
      }
      return longest
    },

    hasJournaledToday(): boolean {
      const days = this.sortedEntryDayIndexes
      if (days.length === 0) return false
      return days[days.length - 1] === this.todayIndex
    }
  },

  actions: {
    // Recomputes todayIndex from the wall clock, assigning only if it
    // actually differs - so this is a no-op (no re-render) on the common
    // case where it's already current. See todayIndex's own comment above
    // for why a client-side call to this is required, not just a nicety.
    touchToday() {
      const current = toDayIndex(new Date())
      if (current !== this.todayIndex) this.todayIndex = current
    },

    async createEntry(entrySubmitted: any) {
      try {
        const entry = await authFetch('/api/qtJournalEntries', {
          method: 'POST',
          body: entrySubmitted
        })
        // List is newest-first from the server; unshift keeps a freshly-created
        // entry visible at the top without a refetch.
        this.qtEntries.unshift(entry)
        this.entryDates.push(entry.date)
        return true
      } catch (e) {
        reportClientError('journal: save failed', e)
        return false
      }
    },

    // Stores the first paginated page from /api/qtJournalEntries (list mode),
    // which now returns { entries, hasMore } instead of a bare array.
    storeFirstPage(entries: any[], hasMore: boolean) {
      this.qtEntries = entries
      this.hasMoreEntries = hasMore
    },

    appendQTEntries(entries: any[]) {
      this.qtEntries.push(...entries)
    },

    // Inserts or replaces a single entry (e.g. from the single-entry detail
    // fetch) - keeps getEntryUsingID/retrievedEntry working on the detail page
    // without requiring the paginated list to already contain it.
    upsertEntry(entry: any) {
      const idx = this.qtEntries.findIndex((e: any) => e._id === entry._id)
      if (idx !== -1) {
        this.qtEntries[idx] = entry
      } else {
        this.qtEntries.push(entry)
      }
    },

    async loadMore(limit = DEFAULT_PAGE_SIZE) {
      const userStore = useUserStore()
      try {
        const { entries, hasMore } = await authFetch('/api/qtJournalEntries', {
          params: { creatorEmail: userStore.userID, skip: this.qtEntries.length, limit }
        })
        this.appendQTEntries(entries)
        this.hasMoreEntries = hasMore
      } catch (e) {
        reportClientError('journal: loading more entries failed', e)
      }
    },

    // Cheap dates-only fetch backing the streak getters - independent of
    // qtEntries' pagination, so streaks always reflect the full history.
    // Returns whether it actually landed (mirrors passageStore.refreshPassage
    // - stores/passage.ts:25), so a caller like pages/index.vue's wake
    // handler can retry instead of silently pinning stale data after a
    // failed background sync.
    async fetchEntryDates(): Promise<boolean> {
      const userStore = useUserStore()
      try {
        this.entryDates = await authFetch('/api/qtJournalEntries', {
          params: { creatorEmail: userStore.userID, mode: 'dates' }
        }).then((dates: any[]) => dates.map((d) => d.date))
        return true
      } catch (e) {
        // Swallowed in general - both callers treat the streak/dates fetch as
        // non-fatal, the rest of their page must still render. The one
        // exception: a still-pending-verification account needs its caller's
        // useAsyncData `error` ref to actually see this, so it can redirect
        // to the verify-email page instead of silently rendering as if
        // nothing happened - rethrow only that one, narrowly, rather than
        // making this non-fatal-on-failure behavior fatal in general.
        if (isEmailNotVerifiedError(e)) throw e
        reportClientError('journal: loading entry dates (streak) failed', e)
        return false
      }
    },

    async updateEntry(entrySubmitted: any) {
      try {
        const updated: any = await authFetch('/api/qtJournalEntries', {
          method: 'PUT',
          body: {
            journalID: entrySubmitted.journalID,
            title: entrySubmitted.title,
            thoughts: entrySubmitted.thoughts,
            applicationImplication: entrySubmitted.applicationImplication
          }
        })
        const idx = this.qtEntries.findIndex((e: any) => e._id === updated._id)
        if (idx !== -1) this.qtEntries[idx] = updated
        return true
      } catch (e) {
        reportClientError('journal: update failed', e)
        return false
      }
    },

    // Returns whether it succeeded, so the page only leaves when it did.
    async deleteEntry(journalID: string): Promise<boolean> {
      try {
        // Capture the date before removing - the entry is always currently
        // loaded/rendered here, so this is the exact value to drop from
        // entryDates too (entryDates holds one entry per date, unpaginated).
        const entry = this.qtEntries.find((e: any) => e._id === journalID)
        await authFetch('/api/qtJournalEntries', { method: 'DELETE', params: { journalID } })
        this.qtEntries = this.qtEntries.filter((e: any) => e._id !== journalID)
        if (entry) {
          // Remove exactly one date matching this entry's calendar day. Which
          // duplicate gets removed doesn't matter for streak correctness - the
          // getters only care whether at least one entry remains for that day.
          const idx = this.entryDates.findIndex((d) => toDayIndex(d) === toDayIndex(entry.date))
          if (idx !== -1) this.entryDates.splice(idx, 1)
        }
        return true
      } catch (e) {
        reportClientError('journal: delete failed', e)
        return false
      }
    },

    clearEntries() {
      this.qtEntries = []
      this.entryDates = []
      this.hasMoreEntries = true
    }
  }
})
