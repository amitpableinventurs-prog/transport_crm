const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['note', 'call', 'email', 'sms', 'follow_up', 'profile_updated', 'status_changed', 'kyc_reviewed', 'kyc_submitted', 'kyc_document_uploaded', 'kyc_document_reviewed'],
        required: true
    },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, default: '', maxlength: 2000 },
    followUpAt: { type: Date, default: null },
    followUpCompletedAt: { type: Date, default: null },
    actorId: { type: String, required: true },
    actorRole: { type: String, required: true, enum: ['admin', 'customer'] }
}, { timestamps: true });

activitySchema.index({ customerId: 1, createdAt: -1 });
activitySchema.index({ customerId: 1, type: 1, createdAt: -1 });

exports.CustomerActivity = mongoose.model('CustomerActivity', activitySchema);