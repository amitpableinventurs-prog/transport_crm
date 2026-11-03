
const Joi = require('joi');

// ==========================================
// REUSABLE DOCUMENT VALIDATION
// ==========================================

const vehicleDocumentSchema = Joi.object({
    documentNumber: Joi.string()
        .trim()
        .max(100)
        .allow('')
        .default(''),

    issueDate: Joi.date()
        .iso()
        .allow(null)
        .default(null),

    expiryDate: Joi.date()
        .iso()
        .allow(null)
        .default(null),

    fileUrl: Joi.string()
        .trim()
        .max(1000)
        .allow('')
        .default(''),

    isVerified: Joi.boolean()
        .default(false)
}).custom((document, helpers) => {
    if (
        document.issueDate &&
        document.expiryDate &&
        document.expiryDate < document.issueDate
    ) {
        return helpers.error('any.invalid');
    }

    return document;
}, 'Document date validation')
.messages({
    'any.invalid': 'Expiry date cannot be before issue date'
});

// ==========================================
// VEHICLE DOCUMENTS VALIDATION
// ==========================================

const documentsSchema = Joi.object({
    registrationCertificate: vehicleDocumentSchema,
    insurance: vehicleDocumentSchema,
    fitnessCertificate: vehicleDocumentSchema,
    pollutionCertificate: vehicleDocumentSchema,
    nationalPermit: vehicleDocumentSchema
}).unknown(false);

// ==========================================
// VEHICLE CREATION VALIDATION
// ==========================================

const createVehicleSchema = Joi.object({
    registrationNumber: Joi.string()
        .trim()
        .uppercase()
        .replace(/\s+/g, '')
        .min(5)
        .max(20)
        .required()
        .messages({
            'string.empty': 'Vehicle registration number is required',
            'any.required': 'Vehicle registration number is required'
        }),

    vehicleType: Joi.string()
        .valid(
            'Truck',
            'Trailer',
            'Container',
            'Pickup',
            'Tempo',
            'Tanker',
            'Van',
            'Other'
        )
        .required(),

    vehicleCategory: Joi.string()
        .trim()
        .max(100)
        .allow('')
        .default(''),

    manufacturer: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required(),

    model: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .required(),

    manufacturingYear: Joi.number()
        .integer()
        .min(1950)
        .max(new Date().getFullYear())
        .required(),

    color: Joi.string()
        .trim()
        .max(50)
        .allow('')
        .default(''),

    capacity: Joi.object({
        value: Joi.number()
            .positive()
            .required(),

        unit: Joi.string()
            .valid('Ton', 'KG', 'Litre')
            .default('Ton')
    })
        .required()
        .unknown(false),

    fuelType: Joi.string()
        .valid(
            'Diesel',
            'Petrol',
            'CNG',
            'LNG',
            'Electric',
            'Hybrid',
            'Other'
        )
        .required(),

    chassisNumber: Joi.string()
        .trim()
        .uppercase()
        .max(100)
        .allow('')
        .default(''),

    engineNumber: Joi.string()
        .trim()
        .uppercase()
        .max(100)
        .allow('')
        .default(''),

    ownershipType: Joi.string()
        .valid('Owned', 'Leased', 'Attached')
        .default('Owned'),

    purchaseDate: Joi.date()
        .iso()
        .allow(null)
        .default(null),

    documents: documentsSchema.default({}),

    notes: Joi.string()
        .trim()
        .max(1000)
        .allow('')
        .default('')
}).unknown(false);

// ==========================================
// VEHICLE UPDATE VALIDATION
// ==========================================

const updateVehicleSchema = Joi.object({
    registrationNumber: Joi.string()
        .trim()
        .uppercase()
        .replace(/\s+/g, '')
        .min(5)
        .max(20),

    vehicleType: Joi.string()
        .valid(
            'Truck',
            'Trailer',
            'Container',
            'Pickup',
            'Tempo',
            'Tanker',
            'Van',
            'Other'
        ),

    vehicleCategory: Joi.string()
        .trim()
        .max(100)
        .allow(''),

    manufacturer: Joi.string()
        .trim()
        .min(2)
        .max(100),

    model: Joi.string()
        .trim()
        .min(1)
        .max(100),

    manufacturingYear: Joi.number()
        .integer()
        .min(1950)
        .max(new Date().getFullYear()),

    color: Joi.string()
        .trim()
        .max(50)
        .allow(''),

    capacity: Joi.object({
        value: Joi.number()
            .positive()
            .required(),

        unit: Joi.string()
            .valid('Ton', 'KG', 'Litre')
            .default('Ton')
    }).unknown(false),

    fuelType: Joi.string()
        .valid(
            'Diesel',
            'Petrol',
            'CNG',
            'LNG',
            'Electric',
            'Hybrid',
            'Other'
        ),

    chassisNumber: Joi.string()
        .trim()
        .uppercase()
        .max(100)
        .allow(''),

    engineNumber: Joi.string()
        .trim()
        .uppercase()
        .max(100)
        .allow(''),

    ownershipType: Joi.string()
        .valid('Owned', 'Leased', 'Attached'),

    purchaseDate: Joi.date()
        .iso()
        .allow(null),

    documents: documentsSchema,

    notes: Joi.string()
        .trim()
        .max(1000)
        .allow('')
})
    .min(1)
    .unknown(false)
    .messages({
        'object.min': 'At least one field is required for update'
    });

// ==========================================
// VEHICLE STATUS UPDATE VALIDATION
// ==========================================

const updateVehicleStatusSchema = Joi.object({
    vehicleStatus: Joi.string()
        .valid(
            'Available',
            'Allocated',
            'OnTrip',
            'UnderMaintenance',
            'Inactive'
        )
        .required()
        .messages({
            'any.required': 'Vehicle status is required',
            'string.empty': 'Vehicle status is required',
            'any.only': 'Invalid vehicle status'
        })
}).unknown(false);

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    createVehicleSchema,
    updateVehicleSchema,
    updateVehicleStatusSchema
};
