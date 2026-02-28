const mongoose = require('mongoose');

const timelineEntrySchema = new mongoose.Schema({
    status: String,
    message: String,
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const donationSchema = new mongoose.Schema({
    donorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    causeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cause',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 10,
    },
    utrId: {
        type: String,
        default: '',
    },
    screenshotPath: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending',
    },
    timeline: [timelineEntrySchema],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Donation', donationSchema);
