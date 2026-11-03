
const mongoose = require('mongoose');

const { Schema } = mongoose;

// Vehicle Allocation Schema
const vehicleAllocationSchema = new Schema(
    {
        allocationNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
            immutable: true
        },

        bookingId: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
            required: true
        },

        vehicleId: {
            type: Schema.Types.ObjectId,
            ref: 'Vehicle',
            required: true
        },

        allocationStatus: {
            type: String,
            enum: [
                'Allocated',
                'Released',
                'Cancelled'
            ],
            default: 'Allocated'
        },

        allocatedAt: {
            type: Date,
            default: Date.now
        },

        plannedPickupDate: {
            type: Date,
            required: true
        },

        plannedDeliveryDate: {
            type: Date,
            required: true
        },

        allocatedBy: {
            type: Schema.Types.ObjectId,
            default: null
        },

        remarks: {
            type: String,
            trim: true,
            default: ''
        },

        releasedAt: {
            type: Date,
            default: null
        },

        releasedBy: {
            type: Schema.Types.ObjectId,
            default: null
        },

        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Frequently used queries
vehicleAllocationSchema.index({
    bookingId: 1,
    allocationStatus: 1
});

vehicleAllocationSchema.index({
    vehicleId: 1,
    plannedPickupDate: 1,
    plannedDeliveryDate: 1
});

vehicleAllocationSchema.index({
    allocationStatus: 1,
    createdAt: -1
});

const VehicleAllocation = mongoose.model(
    'VehicleAllocation',
    vehicleAllocationSchema
);

module.exports = VehicleAllocation;
