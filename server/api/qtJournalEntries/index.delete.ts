import { QTEntryModel } from '../../models/QTEntry'
import { checkUser, requireOwner } from '../../utils/auth'
import { logger } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  // Fix (§10, IDOR): the Nuxt 2 route never checked that the requester owns this
  // entry - any authenticated user could delete any entry by guessing its _id.
  await checkUser(event)
  const query = getQuery(event)
  const journalID = query.journalID as string

  const entry = await QTEntryModel.findOne({ _id: journalID })
  if (!entry) {
    throw createError({ statusCode: 404, statusMessage: 'Entry not found' })
  }
  await requireOwner(event, entry.creatorEmail)

  await QTEntryModel.deleteOne({ _id: journalID })
  logger.info(`SERVER ROUTER: QT Journal Entry ID : ${journalID} has been deleted`)
  return { success: true }
})
