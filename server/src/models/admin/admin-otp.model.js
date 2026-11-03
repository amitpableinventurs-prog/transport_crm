const mongoose = require('mongoose');

const adminOtpSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true },
    codeHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    attempts: { type: Number, default: 0, min: 0 },
    lockedUntil: { type: Date, default: null },
    lastSentAt: { type: Date, required: true }
}, { timestamps: true });

exports.AdminOtp = mongoose.model('AdminOtp', adminOtpSchema);