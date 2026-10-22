export const usePlanStore = defineStore('plan', {
  state: () => ({
    chosenPlan: null as string | null,
    plans: [] as any[]
  }),

  getters: {
    getPlans: (state) => state.plans,
    getChosenPlan: (state) => state.chosenPlan
  },

  actions: {
    // create/update/delete return whether they succeeded, so pages can stay
    // put and say so on failure instead of moving on as if it had worked.
    async createPlan(planSubmitted: any): Promise<boolean> {
      try {
        // Push the server's returned document (with its real Mongo _id), not the
        // submitted input - fixes a latent Nuxt 2 bug where the newly created plan
        // was pushed to local state without an _id at all.
        const plan = await authFetch('/api/plans', { method: 'POST', body: planSubmitted })
        this.plans.push(plan)
        return true
      } catch (e) {
        reportClientError('plan: create failed', e)
        return false
      }
    },

    async updatePlan(planSubmitted: any): Promise<boolean> {
      const userStore = useUserStore()
      userStore.syncCookie()
      try {
        const updated: any = await authFetch('/api/plans', {
          method: 'PUT',
          body: {
            planID: planSubmitted._id,
            planName: planSubmitted.planName,
            description: planSubmitted.description,
            passages: planSubmitted.passages
          }
        })
        const idx = this.plans.findIndex((p: any) => p._id === updated._id)
        if (idx !== -1) this.plans[idx] = updated
        return true
      } catch (e) {
        reportClientError('plan: update failed', e)
        return false
      }
    },

    async setChosenPlan(planID: string) {
      this.chosenPlan = planID
      const userStore = useUserStore()
      try {
        await authFetch('/api/users/planChosen', {
          method: 'POST',
          body: { userID: userStore.userID, planChosen: planID }
        })
        const passageStore = usePassageStore()
        await passageStore.refreshPassage()
      } catch (e) {
        reportClientError('plan: choosing a plan failed', e)
      }
    },

    clearChosenPlan() {
      this.chosenPlan = null
    },

    storePlans(plans: any[]) {
      this.plans = plans
    },

    async getPlanChosen() {
      const userStore = useUserStore()
      if (userStore.userID == null) return
      try {
        const data: any = await authFetch('/api/users/planChosen', {
          params: { userID: userStore.userID }
        })
        this.chosenPlan = data.planChosen
      } catch (e) {
        // Swallowed in general (callers render regardless of whether the
        // chosen plan loaded), except a still-pending-verification account -
        // see stores/journal.ts's fetchEntryDates for the same rationale.
        // This is also the on-mount gate for the two action-only pages
        // (journalList/createEntry, plansList/createPlan) that have no
        // useAsyncData of their own to surface this through.
        if (isEmailNotVerifiedError(e)) throw e
        reportClientError('plan: loading the chosen plan failed', e)
      }
    },

    async deletePlan(planID: string): Promise<boolean> {
      const userStore = useUserStore()
      userStore.syncCookie()
      try {
        await authFetch('/api/plans', { method: 'DELETE', params: { planID } })
        this.plans = this.plans.filter((p: any) => p._id !== planID)
        // The server moved this user to the default plan if they had chosen
        // the deleted one - pick that up rather than keep a stale choice.
        if (this.chosenPlan === planID) await this.getPlanChosen()
        return true
      } catch (e) {
        reportClientError('plan: delete failed', e)
        return false
      }
    },

    clearPlans() {
      this.plans = []
    }
  }
})
