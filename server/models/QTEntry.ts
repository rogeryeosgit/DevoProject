import mongoose, { type Model } from 'mongoose'
// @ts-expect-error - no published types for mongoose-field-encryption
import mongooseFieldEncryption from 'mongoose-field-encryption'
import { queryTiming } from '../utils/queryTiming'

const { Schema, model, models } = mongoose
const { fieldEncryption } = mongooseFieldEncryption

export interface QTEntryDocument {
  creatorEmail: string
  date: Date
  passageReference: string
  title: string
  thoughts: string
  applicationImplication: string
}

const QTEntrySchema = new Schema<QTEntryDocument>({
  creatorEmail: { type: String, required: true, lowercase: true, trim: true },
  date: { type: Date, required: true },
  passageReference: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  thoughts: { type: String, required: true, trim: true },
  applicationImplication: { type: String, required: true, trim: true }
})

// Backs the journal list's find({ creatorEmail }).sort({ date: -1 }) - without
// it, that query is a full collection scan. On the production collection,
// build this in Atlas directly before deploying so Mongoose's boot-time
// createIndex doesn't do a slow foreground build against live data.
QTEntrySchema.index({ creatorEmail: 1, date: -1 })

// Encrypted at rest. Update paths MUST go through find + mutate + .save() (not
// findOneAndUpdate) so this pre-save hook actually fires - see docs/migration-plan.md
// Phase 1 notes.
QTEntrySchema.plugin(fieldEncryption, {
  fields: ['thoughts', 'applicationImplication'],
  secret: useRuntimeConfig().mongooseSecret
})

QTEntrySchema.plugin(queryTiming)

export const QTEntryModel: Model<QTEntryDocument> = models.QTEntry || model<QTEntryDocument>('QTEntry', QTEntrySchema)
