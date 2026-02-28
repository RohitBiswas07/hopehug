const mongoose = require('mongoose');

const causeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    goalAmount: {
        type: Number,
        required: true,
        min: 1,
    },
    currentAmount: {
        type: Number,
        default: 0,
    },
    ngoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    images: [
        {
            type: String,
        },
    ],
    fundedBy: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'completed'],
        default: 'pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Cause', causeSchema);
