
const mongoose = require('mongoose');

const { Schema } = mongoose;

// Reusable vehicle document schema
const vehicleDocumentSchema = new Schema(
    {
        documentNumber: {
            type: String,
            trim: true,
            default: ''
        },
        issueDate: {
            type: Date,
            default: null
        },
        expiryDate: {
            type: Date,
            default: null
        },
        fileUrl: {
            type: String,
            trim: true,
            default: ''
        },
        isVerified: {
            type: Boolean,
            default: false
        }
    },
    { _id: false }
);

const vehicleSchema = new Schema(
    {
        // Basic Vehicle Information
        registrationNumber: {
            type: String,
            required: [true, 'Vehicle registration number is required'],
            unique: true,
            trim: true,
            uppercase: true,
            set: value => value?.replace(/\s+/g, '')
        },

        vehicleType: {
            type: String,
            required: [true, 'Vehicle type is required'],
            enum: [
                'Truck',
                'Trailer',
                'Container',
                'Pickup',
                'Tempo',
                'Tanker',
                'Van',
                'Other'
            ]
        },

        vehicleCategory: {
            type: String,
            trim: true,
            default: ''
        },

        manufacturer: {
            type: String,
            trim: true,
            required: [true, 'Vehicle manufacturer is required']
        },

        model: {
            type: String,
            trim: true,
            required: [true, 'Vehicle model is required']
        },

        manufacturingYear: {
            type: Number,
            required: [true, 'Manufacturing year is required'],
            min: [1950, 'Invalid manufacturing year'],
            max: [new Date().getFullYear(), 'Manufacturing year cannot be in the future']
        },

        color: {
            type: String,
            trim: true,
            default: ''
        },

        // Vehicle Capacity
        capacity: {
            value: {
                type: Number,
                required: [true, 'Vehicle capacity is required'],
                min: [0.01, 'Capacity must be greater than zero']
            },
            unit: {
                type: String,
                enum: ['Ton', 'KG', 'Litre'],
                default: 'Ton'
            }
        },

        // Vehicle Technical Information
        fuelType: {
            type: String,
            enum: ['Diesel', 'Petrol', 'CNG', 'LNG', 'Electric', 'Hybrid', 'Other'],
            required: [true, 'Fuel type is required']
        },

        chassisNumber: {
            type: String,
            trim: true,
            uppercase: true,
            default: ''
        },

        engineNumber: {
            type: String,
            trim: true,
            uppercase: true,
            default: ''
        },

        ownershipType: {
            type: String,
            enum: ['Owned', 'Leased', 'Attached'],
            default: 'Owned'
        },

        purchaseDate: {
            type: Date,
            default: null
        },

        // Vehicle Documents
        documents: {
            registrationCertificate: {
                type: vehicleDocumentSchema,
                default: () => ({})
            },
            insurance: {
                type: vehicleDocumentSchema,
                default: () => ({})
            },
            fitnessCertificate: {
                type: vehicleDocumentSchema,
                default: () => ({})
            },
            pollutionCertificate: {
                type: vehicleDocumentSchema,
                default: () => ({})
            },
            nationalPermit: {
                type: vehicleDocumentSchema,
                default: () => ({})
            }
        },

        // Fleet Operational Status
        vehicleStatus: {
            type: String,
            enum: [
                'Available',
                'Allocated',
                'OnTrip',
                'UnderMaintenance',
                'Inactive'
            ],
            default: 'Available'
        },

        // Additional Information
        notes: {
            type: String,
            trim: true,
            default: ''
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

// Indexes
vehicleSchema.index({ vehicleStatus: 1 });
vehicleSchema.index({ vehicleType: 1 });
vehicleSchema.index({ isDeleted: 1 });
vehicleSchema.index({ chassisNumber: 1 }, {
    unique: true,
    partialFilterExpression: {
        chassisNumber: { $gt: '' }
    }
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

exports.Vehicle = Vehicle;
