const mongoose = require('mongoose');

const kycDocumentSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
        index: true
    },
    documentType: {
        type: String,
        enum: ['pan', 'gstin', 'address_proof'],
        required: true
    },
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
    originalName: { type: String, required: true, maxlength: 160 },
    contentType: { type: String, enum: ['application/pdf', 'image/jpeg', 'image/png'], required: true },
    size: { type: Number, required: true, min: 1, max: 5 * 1024 * 1024 },
    sha256: { type: String, required: true, select: false },
    status: {
        type: String,
        enum: ['Pending', 'Verified', 'Rejected', 'Superseded'],
        default: 'Pending',
        index: true
    },
    remarks: { type: String, trim: true, default: '', maxlength: 500 },
    reviewedBy: { type: String, trim: true, default: '' },
    reviewedAt: { type: Date, default: null }
}, { timestamps: true });

kycDocumentSchema.index({ customerId: 1, documentType: 1, createdAt: -1 });

exports.CustomerKycDocument = mongoose.model('CustomerKycDocument', kycDocumentSchema);