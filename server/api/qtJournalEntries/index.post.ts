import { QTEntryModel } from '../../models/QTEntry'
import { checkUser } from '../../utils/auth'
import { logger } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  // Fix (§10): creatorEmail is always set from the verified token, never trusted
  // from the client body (the Nuxt 2 route's email-match check silently never ran).
  const email = await checkUser(event)
  const body = await readBody(event)

  const entry = await QTEntryModel.create({
    creatorEmail: email,
    date: body.date,
    passageReference: body.passageReference,
    title: body.title,
    thoughts: body.thoughts,
    applicationImplication: body.applicationImplication
  })

  logger.info(`SERVER ROUTER: qtEntry created (${entry._id}) by ${email}`)
  setResponseStatus(event, 201)
  return entry
})
