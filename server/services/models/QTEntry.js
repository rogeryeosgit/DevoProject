var mongoose = require('mongoose');

var QTEntrySchema = new mongoose.Schema({
    creatorEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    date: {
        type: Date,
        required: true,
        trim: true
    },
    passageReference: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    thoughts: {
        type: String,
        required: true,
        trim: true
    },
    applicationImplication: {
        type: String,
        required: true,
        trim: true
    }
});

module.exports = (mongoose.models && mongoose.models.QTEntry
    ? mongoose.models.QTEntry
    : mongoose.model('QTEntry', QTEntrySchema));