import { PlanModel, DEFAULT_PLAN_NAME } from '../../models/Plan'
import { UserModel } from '../../models/User'
import { checkUser, requireOwner } from '../../utils/auth'
import { logger } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  await checkUser(event)
  const query = getQuery(event)
  const planID = query.planID as string

  const plan = await PlanModel.findOne({ _id: planID })
  if (!plan) {
    // Fix (§10): the Nuxt 2 route read `.creatorEmail` off a possibly-null plan.
    throw createError({ statusCode: 404, statusMessage: 'Plan not found' })
  }
  await requireOwner(event, plan.creatorEmail)

  // New users are given the default plan, and sign-up fails without it
  // (users/verify and users/register return 503) - so it can't be deleted.
  if (plan.planName === DEFAULT_PLAN_NAME) {
    throw createError({ statusCode: 400, statusMessage: 'The default plan cannot be deleted' })
  }

  // Anyone who had chosen this plan moves to the default plan. Deleting it
  // used to leave their planChosen pointing at nothing, silently dropping
  // them onto the Proverbs fallback.
  const defaultPlan = await PlanModel.findOne({ planName: DEFAULT_PLAN_NAME }).select('_id').lean()
  let moved = 0
  if (defaultPlan) {
    const result = await UserModel.updateMany({ planChosen: String(plan._id) }, { $set: { planChosen: String(defaultPlan._id) } })
    moved = result.modifiedCount
  } else {
    logger.warn(`SERVER ROUTER: Default plan not found - users who chose plan ${planID} are left without a plan`)
  }

  await PlanModel.deleteOne({ _id: planID })
  logger.info(`SERVER ROUTER: Plan ID : ${planID} has been deleted (${moved} user(s) moved to the default plan)`)
  return { success: true }
})
