import { PlanModel } from '../../models/Plan'
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

  await PlanModel.deleteOne({ _id: planID })
  logger.info(`SERVER ROUTER: Plan ID : ${planID} has been deleted`)
  return { success: true }
})
