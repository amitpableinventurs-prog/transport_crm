
const Joi = require('joi');

// Create Vehicle Allocation Validation
const createVehicleAllocationSchema = Joi.object({
    bookingId: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            'string.length': 'Invalid booking ID',
            'any.required': 'Booking ID is required'
        }),

    vehicleId: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            'string.length': 'Invalid vehicle ID',
            'any.required': 'Vehicle ID is required'
        }),

    plannedPickupDate: Joi.date()
        .iso()
        .required()
        .messages({
            'date.base': 'Valid pickup date is required',
            'any.required': 'Pickup date is required'
        }),

    plannedDeliveryDate: Joi.date()
        .iso()
        .greater(Joi.ref('plannedPickupDate'))
        .required()
        .messages({
            'date.greater': 'Delivery date must be after pickup date',
            'any.required': 'Delivery date is required'
        }),

    remarks: Joi.string()
        .trim()
        .max(500)
        .allow('')
        .default('')
});

// Update Allocation Status Validation
const updateAllocationStatusSchema = Joi.object({
    allocationStatus: Joi.string()
        .valid('Released', 'Cancelled')
        .required(),

    remarks: Joi.string()
        .trim()
        .max(500)
        .allow('')
        .default('')
});

module.exports = {
    createVehicleAllocationSchema,
    updateAllocationStatusSchema
};
