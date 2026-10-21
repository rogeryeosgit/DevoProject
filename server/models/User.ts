import mongoose, { type Model } from 'mongoose'
import { queryTiming } from '../utils/queryTiming'

const { Schema, model, models } = mongoose

export interface UserDocument {
  email: string
  planChosen: string
  // Set to true in exactly one place: server/api/users/register.post.ts, the
  // instant qtapp's own registration flow creates the Firebase account -
  // never set anywhere else, and cleared permanently by
  // server/api/users/verify.post.ts once verified. Deliberately no schema
  // default: absent (not false) on every account qtapp didn't itself just
  // register, including all pre-existing docs and any sibling-app account's
  // first qtapp login (this app shares one Firebase project with other
  // Navigators apps). server/utils/auth.ts's checkUser is what enforces this.
  pendingVerification?: boolean
}

const UserSchema = new Schema<UserDocument>({
  email: { type: String, required: true, lowercase: true, trim: true },
  planChosen: { type: String, required: true, trim: true },
  pendingVerification: { type: Boolean }
})

// `unique` is load-bearing, not hygiene: it's what makes concurrent
// first-login provisioning attempts (double-click, two tabs) collapse to one
// document instead of racing into duplicates - see
// server/api/users/verify.post.ts's upsert. Build this by hand in Atlas
// BEFORE deploying a change that relies on it (audit for existing duplicate/
// mixed-case emails first) - don't rely on Mongoose's boot-time autoIndex,
// which fails silently here since server/plugins/mongo.ts only listens for
// connection-level errors, not index-build failures.
UserSchema.index({ email: 1 }, { unique: true })

UserSchema.plugin(queryTiming)

export const UserModel: Model<UserDocument> = models.User || model<UserDocument>('User', UserSchema)
