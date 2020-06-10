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

/*
// Implicitely using id from google as password
PlanSchema.statics.findInDB = function (gData, callback) {
  console.log("Here : " + gData.email);
  Plan.findOne({ email: gData.email })
    .exec(function (err, user) {
      if (err) {
        return callback(err)
      } else if (!user) {
        var err = new Error('User not found.');
        err.status = 401;
        return callback(err);
      }
      return callback(err,user); // Found the user in the database
    });
}
*/
var Plan = mongoose.model('Plan', PlanSchema);

module.exports = Plan;