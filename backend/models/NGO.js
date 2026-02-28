const mongoose = require('mongoose');

const ngoSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    orgName: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending',
    },
    documents: [
        {
            type: String,
        },
    ],
    totalReceived: {
        type: Number,
        default: 0,
    },
});

module.exports = mongoose.model('NGO', ngoSchema);
