 
const mongoose = require('mongoose');
const { Vehicle } = require('../../models/fleet/vehicle.model');

// ==========================================
// COMMON ERROR HANDLER
// ==========================================

const createError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// Validate MongoDB ObjectId
const validateObjectId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw createError('Invalid vehicle ID', 400);
    }
};

// Escape special regex characters in search
const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// ==========================================
// 1. CREATE VEHICLE
// ==========================================

const createVehicle = async (vehicleData) => {
    try {
        const existingVehicle = await Vehicle.findOne({
            registrationNumber: vehicleData.registrationNumber
        });

        if (existingVehicle) {
            throw createError(
                'Vehicle with this registration number already exists',
                409
            );
        }

        if (vehicleData.chassisNumber) {
            const existingChassis = await Vehicle.findOne({
                chassisNumber: vehicleData.chassisNumber,
                isDeleted: false
            });

            if (existingChassis) {
                throw createError(
                    'Vehicle with this chassis number already exists',
                    409
                );
            }
        }

        return await Vehicle.create(vehicleData);

    } catch (error) {
        if (error.code === 11000) {
            throw createError(
                'Vehicle registration number or chassis number already exists',
                409
            );
        }

        throw error;
    }
};

// ==========================================
// 2. GET ALL VEHICLES
// ==========================================

const getAllVehicles = async (queryParams) => {
    const {
        search,
        vehicleType,
        vehicleStatus,
        fuelType
    } = queryParams;

    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limit = Math.min(
        100,
        Math.max(1, parseInt(queryParams.limit, 10) || 10)
    );

    const skip = (page - 1) * limit;

    const filter = {
        isDeleted: false
    };

    if (vehicleType) {
        filter.vehicleType = vehicleType;
    }

    if (vehicleStatus) {
        filter.vehicleStatus = vehicleStatus;
    }

    if (fuelType) {
        filter.fuelType = fuelType;
    }

    if (search && search.trim()) {
        const searchRegex = new RegExp(
            escapeRegex(search.trim()),
            'i'
        );

        filter.$or = [
            { registrationNumber: searchRegex },
            { manufacturer: searchRegex },
            { model: searchRegex },
            { chassisNumber: searchRegex }
        ];
    }

    const [vehicles, totalVehicles] = await Promise.all([
        Vehicle.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),

        Vehicle.countDocuments(filter)
    ]);

    return {
        vehicles,
        pagination: {
            totalVehicles,
            currentPage: page,
            totalPages: Math.ceil(totalVehicles / limit),
            pageLimit: limit
        }
    };
};

// ==========================================
// 3. GET VEHICLE BY ID
// ==========================================

const getVehicleById = async (vehicleId) => {
    validateObjectId(vehicleId);

    const vehicle = await Vehicle.findOne({
        _id: vehicleId,
        isDeleted: false
    }).lean();

    if (!vehicle) {
        throw createError('Vehicle not found', 404);
    }

    return vehicle;
};

// ==========================================
// 4. UPDATE VEHICLE DETAILS
// ==========================================

const updateVehicle = async (vehicleId, updateData) => {
    validateObjectId(vehicleId);

    const vehicle = await Vehicle.findOne({
        _id: vehicleId,
        isDeleted: false
    });

    if (!vehicle) {
        throw createError('Vehicle not found', 404);
    }

    // Status must be updated through the dedicated status API
    delete updateData.vehicleStatus;

    // Check duplicate registration number
    if (updateData.registrationNumber) {
        const existingRegistration = await Vehicle.findOne({
            registrationNumber: updateData.registrationNumber,
            _id: { $ne: vehicleId }
        });

        if (existingRegistration) {
            throw createError(
                'Vehicle with this registration number already exists',
                409
            );
        }
    }

    // Check duplicate chassis number
    if (updateData.chassisNumber) {
        const existingChassis = await Vehicle.findOne({
            chassisNumber: updateData.chassisNumber,
            isDeleted: false,
            _id: { $ne: vehicleId }
        });

        if (existingChassis) {
            throw createError(
                'Vehicle with this chassis number already exists',
                409
            );
        }
    }

    try {
        Object.assign(vehicle, updateData);

        await vehicle.save();

        return vehicle;

    } catch (error) {
        if (error.code === 11000) {
            throw createError(
                'Vehicle registration number or chassis number already exists',
                409
            );
        }

        throw error;
    }
};

// ==========================================
// 5. UPDATE VEHICLE STATUS
// ==========================================

// Allowed vehicle status transitions
const allowedStatusTransitions = {
    Available: [
        'Allocated',
        'UnderMaintenance',
        'Inactive'
    ],

    Allocated: [
        'Available',
        'OnTrip'
    ],

    OnTrip: [
        'Available',
        'UnderMaintenance'
    ],

    UnderMaintenance: [
        'Available',
        'Inactive'
    ],

    Inactive: [
        'Available'
    ]
};

const updateVehicleStatus = async (vehicleId, newStatus) => {
    validateObjectId(vehicleId);

    const vehicle = await Vehicle.findOne({
        _id: vehicleId,
        isDeleted: false
    });

    if (!vehicle) {
        throw createError('Vehicle not found', 404);
    }

    const currentStatus = vehicle.vehicleStatus;

    // Check if requested transition is allowed
    const allowedTransitions =
        allowedStatusTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
        throw createError(
            `Vehicle status cannot be changed from ${currentStatus} to ${newStatus}`,
            400
        );
    }

    vehicle.vehicleStatus = newStatus;

    await vehicle.save();

    return vehicle;
};

// ==========================================
// 6. DELETE VEHICLE (SOFT DELETE)
// ==========================================

const deleteVehicle = async (vehicleId) => {
    validateObjectId(vehicleId);

    const vehicle = await Vehicle.findOne({
        _id: vehicleId,
        isDeleted: false
    });

    if (!vehicle) {
        throw createError('Vehicle not found', 404);
    }

    if (
        vehicle.vehicleStatus === 'Allocated' ||
        vehicle.vehicleStatus === 'OnTrip'
    ) {
        throw createError(
            'Allocated or OnTrip vehicle cannot be deleted',
            400
        );
    }

    vehicle.isDeleted = true;
    vehicle.vehicleStatus = 'Inactive';

    await vehicle.save();

    return {
        message: 'Vehicle deleted successfully'
    };
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    createVehicle,
    getAllVehicles,
    getVehicleById,
    updateVehicle,
    updateVehicleStatus,
    deleteVehicle
};
