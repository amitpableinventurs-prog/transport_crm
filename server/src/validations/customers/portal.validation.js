const Joi = require('joi');

const VEHICLE_TYPES = ['Mini Truck', 'Pickup', 'Truck', 'Container', 'Trailer', 'Tanker'];

// PATCH /portal/profile  (sab optional, kam se kam 1 field chahiye)
const validateUpdateProfile = (data) => Joi.object({
    companyName: Joi.string().trim(),
    contactPerson: Joi.string().trim(),
    email: Joi.string().email().trim(),
    gstin: Joi.string().uppercase().trim().allow('')
        .pattern(/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/)
        .messages({ 'string.pattern.base': 'Invalid GSTIN.' }),
    pan: Joi.string().uppercase().trim()
        .pattern(/^[A-Z]{5}\d{4}[A-Z]$/)
        .messages({ 'string.pattern.base': 'Invalid PAN.' }),
    address: Joi.object({
        street: Joi.string().trim(),
        city: Joi.string().trim(),
        state: Joi.string().trim(),
        pincode: Joi.string().pattern(/^\d{6}$/)
            .messages({ 'string.pattern.base': 'Pincode must be 6 digits.' })
    }).min(1)
}).min(1).validate(data);

// POST /portal/addresses  aur  PUT /portal/addresses/:id
const validateAddress = (data) => Joi.object({
    label: Joi.string().trim().max(30),
    address: Joi.string().trim().required(),
    city: Joi.string().trim().required(),
    state: Joi.string().trim().required(),
    pincode: Joi.string().pattern(/^\d{6}$/).required()
        .messages({ 'string.pattern.base': 'Pincode must be 6 digits.' }),
    contactName: Joi.string().allow('').trim(),
    contactPhone: Joi.string().allow('').trim(),
    isDefault: Joi.boolean()
}).validate(data);

// PATCH /portal/preferences  (sab optional, kam se kam 1 field)
const validatePreferences = (data) => Joi.object({
    language: Joi.string().valid('en', 'hi', 'mr', 'gu'),
    defaultVehicleType: Joi.string().valid(...VEHICLE_TYPES, ''),
    notifyBySms: Joi.boolean(),
    notifyByEmail: Joi.boolean()
}).min(1).validate(data);

module.exports = { validateUpdateProfile, validateAddress, validatePreferences };