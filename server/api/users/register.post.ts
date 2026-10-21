import { UserModel } from '../../models/User'
import { PlanModel, DEFAULT_PLAN_NAME } from '../../models/Plan'
import { getEmailFromToken } from '../../utils/auth'
import { logger } from '../../utils/logger'

// Called exactly once, immediately after createUserWithEmailAndPassword
// succeeds client-side (stores/user.ts's register path) - the one moment
// qtapp knows for certain it just minted this Firebase identity itself, as
// opposed to someone from a sibling app (this Firebase project is shared)
// logging into qtapp for the first time, which goes through
// server/api/users/verify.post.ts instead and never sets pendingVerification.
// Marking it here, and only here, is what lets checkUser gate exactly the
// population this feature is about without catching cross-app first logins.
//
// At the moment this runs no User doc exists yet for this email, so
// checkUser's verification gate (which only fires for identities that
// already have a pendingVerification:true doc) doesn't block this call -
// it's what creates the state the gate later checks.
export default defineEventHandler(async (event) => {
  const email = await getEmailFromToken(event)

  const defaultPlan = await PlanModel.findOne({ planName: DEFAULT_PLAN_NAME }).select('_id').lean()
  if (!defaultPlan) {
    logger.error(`SERVER ROUTER: Default plan not found, cannot provision ${email}`)
    throw createError({ statusCode: 503, statusMessage: 'Account setup unavailable' })
  }

  try {
    await UserModel.findOneAndUpdate(
      { email },
      { $setOnInsert: { email, planChosen: String(defaultPlan._id), pendingVerification: true } },
      { upsert: true }
    )
  } catch (err: any) {
    // E11000: a concurrent call (double-click) won the race - the doc exists
    // now, which is the only thing we wanted.
    if (err?.code !== 11000) throw err
  }
  logger.info(`SERVER ROUTER: User ${email} registered (pending email verification)`)

  return { ok: true }
})
