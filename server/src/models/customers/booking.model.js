 
const mongoose = require('mongoose');

const { Schema } = mongoose;

// Address used separately for pickup and delivery
const addressSchema = new Schema(
    {
        contactName: {
            type: String,
            trim: true,
            required: true
        },
        contactPhone: {
            type: String,
            trim: true,
            required: true
        },
        street: {
            type: String,
            trim: true,
            required: true
        },
        city: {
            type: String,
            trim: true,
            required: true
        },
        state: {
            type: String,
            trim: true,
            required: true
        },
        pincode: {
            type: String,
            trim: true,
            required: true
        },
        landmark: {
            type: String,
            trim: true,
            default: ''
        },
        country: {
            type: String,
            trim: true,
            default: 'India'
        }
    },
    { _id: false }
);

// Cargo details
const cargoSchema = new Schema(
    {
        goodsType: {
            type: String,
            trim: true,
            required: true
        },
        description: {
            type: String,
            trim: true,
            default: ''
        },
        packageType: {
            type: String,
            enum: [
                'carton',
                'box',
                'bag',
                'pallet',
                'drum',
                'container',
                'loose',
                'other'
            ],
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        weightKg: {
            type: Number,
            required: true,
            min: 0.01
        },
        volumeCbm: {
            type: Number,
            min: 0,
            default: 0
        },
        dimensionsCm: {
            length: { type: Number, min: 0, default: 0 },
            width: { type: Number, min: 0, default: 0 },
            height: { type: Number, min: 0, default: 0 }
        },
        isFragile: {
            type: Boolean,
            default: false
        },
        isHazardous: {
            type: Boolean,
            default: false
        },
        specialInstructions: {
            type: String,
            trim: true,
            default: ''
        }
    },
    { _id: false }
);

// Required vehicle information
const vehicleRequirementSchema = new Schema(
    {
        vehicleType: {
            type: String,
            trim: true,
            required: true
        },
        minCapacityKg: {
            type: Number,
            min: 0,
            default: 0
        },
        preferredVehicleNumber: {
            type: String,
            trim: true,
            uppercase: true,
            default: ''
        },
        specialRequirements: {
            type: String,
            trim: true,
            default: ''
        }
    },
    { _id: false }
);

// Pickup and delivery schedule
const scheduleSchema = new Schema(
    {
        pickupDate: {
            type: Date,
            required: true
        },
        expectedDeliveryDate: {
            type: Date,
            required: true
        },
        pickupTimeSlot: {
            type: String,
            trim: true,
            default: ''
        }
    },
    { _id: false }
);

// Booking charges
const pricingSchema = new Schema(
    {
        freightCharges: {
            type: Number,
            min: 0,
            default: 0
        },
        loadingCharges: {
            type: Number,
            min: 0,
            default: 0
        },
        unloadingCharges: {
            type: Number,
            min: 0,
            default: 0
        },
        otherCharges: {
            type: Number,
            min: 0,
            default: 0
        },
        discount: {
            type: Number,
            min: 0,
            default: 0
        },
        taxRate: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        taxAmount: {
            type: Number,
            min: 0,
            default: 0
        },
        totalAmount: {
            type: Number,
            min: 0,
            default: 0
        },
        currency: {
            type: String,
            uppercase: true,
            default: 'INR'
        },
        quotationValidUntil: {
            type: Date,
            default: null
        }
    },
    { _id: false }
);

// Status change history
const statusHistorySchema = new Schema(
    {
        status: {
            type: String,
            required: true,
            enum: [
                'draft',
                'pending',
                'under_review',
                'quoted',
                'confirmed',
                'rejected',
                'cancelled',
                'expired'
            ]
        },
        changedBy: {
            type: Schema.Types.ObjectId,
            default: null
        },
        changedByRole: {
            type: String,
            enum: ['customer', 'admin', 'manager', 'system'],
            default: 'system'
        },
        changedByActor: {
            type: String,
            trim: true,
            default: ''
        },
        remarks: {
            type: String,
            trim: true,
            default: ''
        },
        changedAt: {
            type: Date,
            default: Date.now
        }
    },
    { _id: false }
);

// Main Booking Schema
const bookingSchema = new Schema(
    {
        bookingNumber: {
            type: String,
            required: true,
            unique: true,
            immutable: true,
            trim: true,
            uppercase: true
        },

        // Existing Customer model reference
        customerId: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            required: true
        },

        branchId: {
            type: Schema.Types.ObjectId,
            default: null
        },

        bookingSource: {
            type: String,
            enum: [
                'customer_portal',
                'admin',
                'transport_manager',
                'online',
                'other'
            ],
            default: 'customer_portal'
        },

        pickupAddress: {
            type: addressSchema,
            required: true
        },

        deliveryAddress: {
            type: addressSchema,
            required: true
        },

        cargo: {
            type: cargoSchema,
            required: true
        },

        vehicleRequirement: {
            type: vehicleRequirementSchema,
            required: true
        },

        schedule: {
            type: scheduleSchema,
            required: true
        },

        pricing: {
            type: pricingSchema,
            default: () => ({})
        },

        bookingStatus: {
            type: String,
            enum: [
                'draft',
                'pending',
                'under_review',
                'quoted',
                'confirmed',
                'rejected',
                'cancelled',
                'expired'
            ],
            default: 'pending'
        },

        statusHistory: {
            type: [statusHistorySchema],
            default: []
        },

        cancellation: {
            reason: {
                type: String,
                trim: true,
                default: ''
            },
            cancelledBy: {
                type: Schema.Types.ObjectId,
                default: null
            },
            cancelledAt: {
                type: Date,
                default: null
            }
        },

        internalNotes: {
            type: String,
            trim: true,
            default: '',
            select: false
        },

        createdBy: {
            type: Schema.Types.ObjectId,
            default: null
        },

        updatedBy: {
            type: Schema.Types.ObjectId,
            default: null
        },

        isArchived: {
            type: Boolean,
            default: false
        },

        archivedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Validate delivery date
bookingSchema.pre('validate', function (next) {
    const pickupDate = this.schedule?.pickupDate;
    const deliveryDate = this.schedule?.expectedDeliveryDate;

    if (pickupDate && deliveryDate && deliveryDate < pickupDate) {
        this.invalidate(
            'schedule.expectedDeliveryDate',
            'Delivery date cannot be before pickup date.'
        );
    }

    next();
});

// Indexes for frequently used queries
bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ bookingStatus: 1, createdAt: -1 });
bookingSchema.index({
    'schedule.pickupDate': 1,
    bookingStatus: 1
});
bookingSchema.index({ branchId: 1, bookingStatus: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
