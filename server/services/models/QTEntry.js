var mongoose = require('mongoose');

var QTEntry = new mongoose.Schema({
    entryData: {
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
    passage: {
        type: String,
        required: true,
        trim: true
    }
});

module.exports = QTEntry;