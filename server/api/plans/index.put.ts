import { PlanModel } from '../../models/Plan'
import { checkUser, requireOwner } from '../../utils/auth'
import { logger } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  await checkUser(event)
  const body = await readBody(event)

  const plan = await PlanModel.findOne({ _id: body.planID })
  if (!plan) {
    // Fix (§10): the Nuxt 2 route read `.creatorEmail` off a possibly-null plan.
    throw createError({ statusCode: 404, statusMessage: 'Plan not found' })
  }
  await requireOwner(event, plan.creatorEmail)

  plan.planName = body.planName
  plan.description = body.description
  plan.passages = body.passages
  await plan.save()
  logger.info(`SERVER ROUTER: Plan : ${plan.planName} updated (${plan._id})`)

  return plan
})
