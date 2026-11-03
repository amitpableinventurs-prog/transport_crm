const mongoose = require('mongoose');

// ======================================================
// COMMON VALIDATION HELPERS
// ======================================================

// Check required text fields
const isRequiredString = (value) => {
    return typeof value === 'string' && value.trim().length > 0;
};

// Check MongoDB ObjectId
const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// Validate date
const isValidDate = (date) => {
    return date && !Number.isNaN(new Date(date).getTime());
};

// Send validation errors
const sendValidationError = (res, errors) => {
    return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
    });
};


// ======================================================
// 1. CREATE BOOKING VALIDATOR
// Vehicle Booking + Online Booking
// ======================================================

exports.validateCreateBooking = (req, res, next) => {
    const errors = [];
    const {
        pickupAddress,
        deliveryAddress,
        cargo,
        vehicleRequirement,
        schedule
    } = req.body;

    // Pickup Address Validation
    if (!pickupAddress) {
        errors.push('Pickup address is required');
    } else {
        ['contactName', 'contactPhone', 'street', 'city', 'state', 'pincode']
            .forEach((field) => {
                if (!isRequiredString(pickupAddress[field])) {
                    errors.push(`Pickup ${field} is required`);
                }
            });
    }

    // Delivery Address Validation
    if (!deliveryAddress) {
        errors.push('Delivery address is required');
    } else {
        ['contactName', 'contactPhone', 'street', 'city', 'state', 'pincode']
            .forEach((field) => {
                if (!isRequiredString(deliveryAddress[field])) {
                    errors.push(`Delivery ${field} is required`);
                }
            });
    }

    // Cargo Validation
    if (!cargo) {
        errors.push('Cargo details are required');
    } else {
        if (!isRequiredString(cargo.goodsType)) {
            errors.push('Cargo goods type is required');
        }

        const allowedPackageTypes = [
            'carton', 'box', 'bag', 'pallet',
            'drum', 'container', 'loose', 'other'
        ];

        if (!allowedPackageTypes.includes(cargo.packageType)) {
            errors.push('Valid cargo package type is required');
        }

        if (!Number.isInteger(Number(cargo.quantity)) || Number(cargo.quantity) < 1) {
            errors.push('Cargo quantity must be at least 1');
        }

        if (!Number.isFinite(Number(cargo.weightKg)) || Number(cargo.weightKg) < 0.01) {
            errors.push('Cargo weight must be at least 0.01 kg');
        }

        if (
            cargo.volumeCbm !== undefined &&
            (!Number.isFinite(Number(cargo.volumeCbm)) || Number(cargo.volumeCbm) < 0)
        ) {
            errors.push('Cargo volume cannot be negative');
        }

        if (
            cargo.dimensionsCm &&
            ['length', 'width', 'height'].some((field) =>
                !Number.isFinite(Number(cargo.dimensionsCm[field])) ||
                Number(cargo.dimensionsCm[field]) < 0
            )
        ) {
            errors.push('Cargo dimensions must be valid non-negative numbers');
        }
    }

    // Vehicle Requirement Validation
    if (!vehicleRequirement) {
        errors.push('Vehicle requirement is required');
    } else {
        if (!isRequiredString(vehicleRequirement.vehicleType)) {
            errors.push('Vehicle type is required');
        }

        if (
            vehicleRequirement.minCapacityKg !== undefined &&
            (!Number.isFinite(Number(vehicleRequirement.minCapacityKg)) ||
                Number(vehicleRequirement.minCapacityKg) < 0)
        ) {
            errors.push('Minimum vehicle capacity cannot be negative');
        }
    }

    // Schedule Validation
    if (!schedule) {
        errors.push('Booking schedule is required');
    } else {
        if (!isValidDate(schedule.pickupDate)) {
            errors.push('Valid pickup date is required');
        }

        if (!isValidDate(schedule.expectedDeliveryDate)) {
            errors.push('Valid expected delivery date is required');
        }

        if (
            isValidDate(schedule.pickupDate) &&
            isValidDate(schedule.expectedDeliveryDate) &&
            new Date(schedule.expectedDeliveryDate) < new Date(schedule.pickupDate)
        ) {
            errors.push('Delivery date cannot be before pickup date');
        }
    }

    // Branch ID Validation
    if (
        req.body.branchId &&
        !isValidObjectId(req.body.branchId)
    ) {
        errors.push('Invalid branch ID');
    }

    if (errors.length > 0) {
        return sendValidationError(res, errors);
    }

    next();
};


// ======================================================
// 2. BOOKING ID VALIDATOR
// Get Booking Details / Update Status / History
// ======================================================

exports.validateBookingId = (req, res, next) => {
    const { bookingId } = req.params;

    if (!isValidObjectId(bookingId)) {
        return sendValidationError(res, [
            'Invalid booking ID'
        ]);
    }

    next();
};


// ======================================================
// 3. CUSTOMER BOOKING LIST VALIDATOR
// Pagination + Status Filter
// ======================================================

exports.validateBookingListQuery = (req, res, next) => {
    const errors = [];
    const { page, limit, status } = req.query;

    if (page !== undefined &&
        (!Number.isInteger(Number(page)) || Number(page) < 1)) {
        errors.push('Page must be a positive integer');
    }

    if (limit !== undefined &&
        (!Number.isInteger(Number(limit)) ||
            Number(limit) < 1 ||
            Number(limit) > 100)) {
        errors.push('Limit must be between 1 and 100');
    }

    const allowedStatuses = [
        'draft',
        'pending',
        'under_review',
        'quoted',
        'confirmed',
        'rejected',
        'cancelled',
        'expired'
    ];

    if (status && !allowedStatuses.includes(status)) {
        errors.push('Invalid booking status filter');
    }

    if (errors.length > 0) {
        return sendValidationError(res, errors);
    }

    next();
};


// ======================================================
// 4. BOOKING CALENDAR VALIDATOR
// Date Range + Status + Branch
// ======================================================

exports.validateBookingCalendarQuery = (req, res, next) => {
    const errors = [];
    const { startDate, endDate, status, branchId } = req.query;

    if (!isValidDate(startDate)) {
        errors.push('Valid start date is required');
    }

    if (!isValidDate(endDate)) {
        errors.push('Valid end date is required');
    }

    if (
        isValidDate(startDate) &&
        isValidDate(endDate) &&
        new Date(endDate) < new Date(startDate)
    ) {
        errors.push('End date cannot be before start date');
    }

    const allowedStatuses = [
        'draft',
        'pending',
        'under_review',
        'quoted',
        'confirmed',
        'rejected',
        'cancelled',
        'expired'
    ];

    if (status && !allowedStatuses.includes(status)) {
        errors.push('Invalid booking status');
    }

    if (branchId && !isValidObjectId(branchId)) {
        errors.push('Invalid branch ID');
    }

    if (errors.length > 0) {
        return sendValidationError(res, errors);
    }

    next();
};


// ======================================================
// 5. UPDATE BOOKING STATUS VALIDATOR
// Admin / Transport Manager
// ======================================================

exports.validateUpdateBookingStatus = (req, res, next) => {
    const errors = [];
    const { status, remarks } = req.body;

    const allowedStatuses = [
        'draft',
        'pending',
        'under_review',
        'quoted',
        'confirmed',
        'rejected',
        'cancelled',
        'expired'
    ];

    if (!allowedStatuses.includes(status)) {
        errors.push('Valid booking status is required');
    }

    if (remarks !== undefined &&
        typeof remarks !== 'string') {
        errors.push('Remarks must be a string');
    }

    if (errors.length > 0) {
        return sendValidationError(res, errors);
    }

    next();
};