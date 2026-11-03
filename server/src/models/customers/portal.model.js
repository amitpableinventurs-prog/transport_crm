const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    label: { type: String, trim: true, default: 'Office' },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    contactName: { type: String, trim: true, default: '' },
    contactPhone: { type: String, trim: true, default: '' },
    isDefault: { type: Boolean, default: false }
}, { timestamps: true });

const portalSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
        unique: true,
        index: true
    },
    addresses: { type: [addressSchema], default: [] },
    preferences: {
        language: { type: String, default: 'en' },
        defaultVehicleType: { type: String, default: '' },
        notifyBySms: { type: Boolean, default: true },
        notifyByEmail: { type: Boolean, default: true }
    },
    lastLoginAt: { type: Date }
}, { timestamps: true });

exports.CustomerPortal = mongoose.model('CustomerPortal', portalSchema);