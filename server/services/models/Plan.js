var mongoose = require('mongoose');

var PlanSchema = new mongoose.Schema({
  creatorEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  planName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  passages: {
    type: Map,
    of: Map,
    required: true,
  },
});

module.exports = (mongoose.models && mongoose.models.Plan
  ? mongoose.models.Plan
  : mongoose.model('Plan', PlanSchema));;