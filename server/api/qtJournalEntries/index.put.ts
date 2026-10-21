import { QTEntryModel } from '../../models/QTEntry'
import { checkUser, requireOwner } from '../../utils/auth'
import { logger } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  // Fix (§10, IDOR): the Nuxt 2 route never checked that the requester owns this
  // entry - any authenticated user could edit any entry by guessing its _id.
  await checkUser(event)
  const body = await readBody(event)

  const entry = await QTEntryModel.findOne({ _id: body.journalID })
  if (!entry) {
    throw createError({ statusCode: 404, statusMessage: 'Entry not found' })
  }
  await requireOwner(event, entry.creatorEmail)

  // find + mutate + .save() (not findOneAndUpdate) so mongoose-field-encryption's
  // pre-save hook actually re-encrypts thoughts/applicationImplication.
  entry.title = body.title
  entry.thoughts = body.thoughts
  entry.applicationImplication = body.applicationImplication
  await entry.save()
  logger.info(`SERVER ROUTER: QT Journal entry ${entry._id} updated`)

  return entry
})
