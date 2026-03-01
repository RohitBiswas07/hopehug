const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
    contentType: { type: String, default: 'image/png' },
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
