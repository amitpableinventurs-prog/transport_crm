const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true
    },
    otp: {
        codeHash: { type: String, select: false },
        expiresAt: { type: Date, select: false },
        attempts: { type: Number, default: 0, min: 0 },
        lockedUntil: { type: Date, default: null, select: false },
        lastSentAt: { type: Date, default: null, select: false }
    },
    refreshToken: {
        type: String,
        select: false
    },
    isProfileComplete: {
        type: Boolean,
        default: false
    },
    companyName: { type: String, trim: true, default: '' },
    contactPerson: { type: String, trim: true, default: '' },
    customerType: {
        type: String,
        enum: ['individual', 'business'],
        default: 'business'
    },
    businessType: { type: String, trim: true, default: '' },
    industry: { type: String, trim: true, default: '' },
    email: { type: String, lowercase: true, trim: true, sparse: true },
    gstin: { type: String, uppercase: true, trim: true, sparse: true },
    pan: { type: String, uppercase: true, trim: true },
    alternatePhone: { type: String, trim: true, default: '' },
    address: {
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        pincode: { type: String, default: '' }
    },
    pickupAddress: {
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        pincode: { type: String, default: '' }
    },
    paymentTerms: { type: String, trim: true, default: 'Advance' },
    creditLimit: { type: Number, min: 0, default: 0 },
    crmStatus: {
        type: String,
        enum: ['Active', 'Inactive', 'Blocked'],
        default: 'Active'
    },
    crmVerificationStatus: {
        type: String,
        enum: ['Pending', 'Verified', 'Rejected'],
        default: 'Pending'
    },
    status: {
        type: String,
        enum: ['Pending', 'Active', 'Suspended'],
        default: 'Active'
    },
    kycStatus: {
        type: String,
        enum: ['NotSubmitted', 'Pending', 'Verified', 'Rejected'],
        default: 'NotSubmitted'
    },
    kycSubmittedAt: { type: Date, default: null },
    kycReviewedAt: { type: Date, default: null },
    kycReviewedBy: { type: String, trim: true, default: '' },
    kycRemarks: { type: String, trim: true, default: '' },
    statusReason: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    lastActiveAt: { type: Date, default: null }
}, {
    timestamps: true
});

customerSchema.methods.markKycNotSubmitted = function markKycNotSubmitted() {
    this.kycStatus = 'NotSubmitted';
    this.kycSubmittedAt = null;
    this.kycReviewedAt = null;
    this.kycReviewedBy = '';
    this.kycRemarks = '';
};

customerSchema.methods.markKycPending = function markKycPending() {
    this.kycStatus = 'Pending';
    this.kycSubmittedAt = new Date();
    this.kycReviewedAt = null;
    this.kycReviewedBy = '';
    this.kycRemarks = '';
};

const Customer = mongoose.model('Customer', customerSchema);
exports.Customer = Customer;