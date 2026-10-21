import { UserModel } from '../../models/User'
import { PlanModel } from '../../models/Plan'
import { checkUser } from '../../utils/auth'
import { warnOncePerDay } from '../../utils/logger'

// Fix (§10): this endpoint had NO authentication at all in the Nuxt 2 app -
// anyone who knew/guessed an email could read another user's chosen plan.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const userID = query.userID as string
  await checkUser(event, userID)

  const user = await UserModel.findOne({ email: userID })
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }
  // A chosen plan that was deleted (or never existed) silently falls back to
  // the default passage on the landing page - surface it so it can be fixed.
  const planExists = await PlanModel.exists({ _id: user.planChosen }).catch(() => null)
  if (!planExists) {
    warnOncePerDay(`dangling-plan:${user.email}`, `PASSAGE: ${user.email}'s chosen plan ${user.planChosen} no longer exists - they see the default passage`)
  }
  return { planChosen: user.planChosen }
})
