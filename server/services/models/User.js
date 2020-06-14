var mongoose = require('mongoose');
var QTEntry = require('./QTEntry');

var UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    planChosen: {
        type: String,
        required: true,
        trim: true
    },
    qtEntries: [QTEntry]
});

module.exports = (mongoose.models && mongoose.models.User
    ? mongoose.models.User
    : mongoose.model('User', UserSchema));