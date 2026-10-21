import type { Schema } from 'mongoose'
import { recordTiming } from './logger'

// Times every MongoDB query/save for SLOW-line breakdowns ("MongoDB
// Plan.findOne 12ms"). Applied per schema in server/models/*.ts, before the
// model is compiled.
const QUERY_OPS = ['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete', 'countDocuments', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'distinct']

export function queryTiming(schema: Schema): void {
  schema.pre(QUERY_OPS as any, function (this: any) {
    this._qtStart = performance.now()
  })
  schema.post(QUERY_OPS as any, function (this: any) {
    if (this._qtStart) recordTiming(`MongoDB ${this.model?.modelName}.${this.op}`, this._qtStart)
  })
  schema.pre('save', function (this: any) {
    this.$locals.qtStart = performance.now()
  })
  schema.post('save', function (this: any) {
    if (this.$locals.qtStart) recordTiming(`MongoDB ${this.constructor?.modelName}.save`, this.$locals.qtStart)
  })
}
