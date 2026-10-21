import { UserModel } from '../../models/User'
import { PlanModel, DEFAULT_PLAN_NAME } from '../../models/Plan'
import { getEmailFromToken } from '../../utils/auth'
import { logger } from '../../utils/logger'

// Login happens client-side against the Firebase client SDK (email/password
// and Google both), and calls this after every successful sign-in - plus
// once more from the "I've verified" action on pages/auth/verify-email. This
// is the one place a Mongo User doc gets provisioned (with the default plan)
// for identities qtapp is seeing for the first time - upsert so two
// near-simultaneous calls (double-click, two tabs) can't create duplicates,
// and fail loudly (not HTTP 200) if provisioning didn't actually happen, so
// a missing default plan doesn't masquerade as success.
//
// Reaching this handler's body at all proves checkUser already saw
// email_verified:true for a still-pending account (getEmailFromToken below
// would have 403'd first otherwise) - so graduating a pending account here
// needs no separate verification check of its own.
export default defineEventHandler(async (event) => {
  const email = await getEmailFromToken(event)

  const existing = await UserModel.findOne({ email }).select('_id pendingVerification').lean()
  if (!existing) {
    // A genuinely new-to-qtapp identity - most likely a sibling app's
    // account logging into qtapp for the first time (this Firebase project
    // is shared). Provision normally; no pendingVerification involved, so
    // it's never gated going forward - see server/api/users/register.post.ts
    // for the one path that does set that flag.
    const defaultPlan = await PlanModel.findOne({ planName: DEFAULT_PLAN_NAME }).select('_id').lean()
    if (!defaultPlan) {
      logger.error(`SERVER ROUTER: Default plan not found, cannot provision ${email}`)
      throw createError({ statusCode: 503, statusMessage: 'Account setup unavailable' })
    }

    try {
      await UserModel.findOneAndUpdate(
        { email },
        { $setOnInsert: { email, planChosen: String(defaultPlan._id) } },
        { upsert: true }
      )
    } catch (err: any) {
      // E11000: a concurrent call (double-click, two tabs) won the race - the
      // doc exists now, which is the only thing we wanted.
      if (err?.code !== 11000) throw err
    }
    logger.info(`SERVER ROUTER: User ${email} provisioned`)
  } else if (existing.pendingVerification) {
    await UserModel.updateOne({ email }, { $unset: { pendingVerification: 1 } })
    logger.info(`SERVER ROUTER: User ${email} verified their email`)
  }

  return { ok: true }
})
