import { toDayIndex } from '~/stores/journal'

export const usePassageStore = defineStore('passage', {
  state: () => ({
    todaysPassage: null as any,
    todaysReference: null as string | null,
    // The calendar day-index (toDayIndex convention) the loaded passage was
    // actually resolved for, as echoed by the server. Lets pages/index.vue
    // tell an SSR-preloaded passage (resolved against the *server's* local
    // day, since no client day is known yet) apart from one resolved against
    // the visitor's own day, and correct it once after hydration if they
    // differ - e.g. a visitor outside the server's timezone.
    passageDay: null as number | null
  }),

  getters: {
    getTodaysPassage: (state) => state.todaysPassage,
    getTodaysReference: (state) => state.todaysReference
  },

  actions: {
    // Returns whether a passage actually came back, so the one caller that needs to
    // know (pages/index.vue's day-rollover check) can retry instead of silently
    // pinning yesterday's text. The other callers ignore the return value.
    async refreshPassage(): Promise<boolean> {
      const planStore = usePlanStore()
      try {
        const data: any = await $fetch('/api/passages/today', {
          params: {
            planID: planStore.chosenPlan,
            // Authoritative, not just a cache discriminator: the server uses this
            // (clamped to +/-1 day of its own clock) to decide "today" instead of
            // its own timezone, so a visitor outside the server's timezone sees
            // their own calendar day rather than the server's - see
            // server/api/passages/today.get.ts's resolveDayIndex. It also still
            // makes the URL change at local midnight, so neither Nitro's route
            // cache nor the browser's HTTP cache can hand back yesterday's cached
            // body to this client-side refetch (a full page reload never hits
            // this, since SSR fetches server-side). Client-only: during SSR
            // there's no client day to send yet, so the server falls back to its
            // own clock for that first paint.
            ...(import.meta.client ? { day: toDayIndex(new Date()) } : {})
          }
        })
        this.todaysPassage = data.passages[0]
        this.todaysReference = data.canonical
        this.passageDay = data.day ?? null
        return true
      } catch (e) {
        reportClientError('passage: refreshing today\'s passage failed', e)
        return false
      }
    },
    refreshTodaysPassage(passage: any) {
      this.todaysPassage = passage
    },
    refreshTodaysReference(reference: string) {
      this.todaysReference = reference
    }
  }
})
