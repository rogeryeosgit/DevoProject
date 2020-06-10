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

var Plan = mongoose.model('Plan', PlanSchema);

module.exports = Plan;