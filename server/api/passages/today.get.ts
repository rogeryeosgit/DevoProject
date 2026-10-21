import { PlanModel, DEFAULT_PLAN_NAME } from '../../models/Plan'
import { getPassage } from '../../utils/bible-retrieval'
import { logger } from '../../utils/logger'

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Same day-index convention as the client's toDayIndex (stores/journal.ts) - a
// count of days since the epoch, derived from local Y/M/D so it's DST-safe.
// Can't import that helper here (Pinia-side module), so it's re-derived; the
// two must stay in lockstep since the client now sends this value as the
// (authoritative, not just cache-busting) `day` param below.
function toDayIndex(d: Date): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000)
}

// Reconstructs the Y/M/D a day index encodes, via the UTC getters rather than
// local ones. A Date built from dayIndex * 86400000 is exactly UTC midnight of
// the encoded Y/M/D, but reading it back with *local* getters only returns
// that same calendar day if the server's own UTC offset happens to be
// non-negative (true for Singapore, not guaranteed everywhere this might ever
// run) - the UTC getters round-trip correctly regardless of server timezone.
function planKeysForDayIndex(dayIndex: number) {
  const d = new Date(dayIndex * 86400000)
  return { month: `${MONTH_ABBR[d.getUTCMonth()]} ${d.getUTCFullYear()}`, day: d.getUTCDate() }
}

// The visitor's own calendar day is only knowable once their browser has run
// - SSR and the very first logged-out paint have no client JS yet, so this
// falls back to the server's own clock in that case (unchanged from before).
// Once the client does send one (every fetch after hydration), it becomes
// authoritative, so a visitor outside the server's own timezone (this app has
// a global audience, the server is pinned to one timezone) sees their own
// today rather than the server's. Clamped to +/-1 day of the server's own
// day: no real timezone differs by more than that, so anything further out
// is a broken device clock or someone spraying values at this public,
// unauthenticated endpoint to multiply cache entries - falls back to the
// server's day rather than trusting it.
function resolveDayIndex(rawDay: unknown): number {
  const serverDayIndex = toDayIndex(new Date())
  const parsed = typeof rawDay === 'string' ? Number(rawDay) : NaN
  if (!Number.isInteger(parsed) || Math.abs(parsed - serverDayIndex) > 1) return serverDayIndex
  return parsed
}

function getDefaultPassage(dayIndex: number): string {
  return `Proverbs ${planKeysForDayIndex(dayIndex).day}`
}

// Echoes the day this was actually resolved for, so the client can tell an
// SSR-preloaded passage (resolved against the *server's* day, since no client
// day was known yet) apart from one resolved against its own local day - see
// stores/passage.ts / pages/index.vue's mount reconcile. Spread, not mutate:
// getPassage's return value is a shared object cached across requests.
async function respondWith(reference: string, dayIndex: number) {
  const passage = await getPassage(reference) as Record<string, unknown>
  return { ...passage, day: dayIndex }
}

// Public: the landing page shows today's passage to logged-out visitors, and it's
// preloaded during SSR regardless of auth state. Do NOT add auth here (§10).
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const planID = query.planID as string | undefined
  const dayIndex = resolveDayIndex(query.day)

  try {
    const plan = planID
      ? await PlanModel.findOne({ _id: planID })
      : await PlanModel.findOne({ planName: DEFAULT_PLAN_NAME })

    if (!plan) {
      return await respondWith(getDefaultPassage(dayIndex), dayIndex)
    }

    const { month, day } = planKeysForDayIndex(dayIndex)
    const reference = plan.passages.get(month)?.get(day.toString())

    if (!reference) {
      return await respondWith(getDefaultPassage(dayIndex), dayIndex)
    }

    return await respondWith(reference, dayIndex)
  } catch (err) {
    logger.error('SERVER ROUTER: today\'s passage failed, falling back to the default passage -', err)
    return await respondWith(getDefaultPassage(dayIndex), dayIndex)
  }
})
