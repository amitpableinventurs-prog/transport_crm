
const mongoose = require('mongoose');

const VehicleAllocation = require('../../models/fleet/vehicleAllocation.model');
const { Vehicle } = require('../../models/fleet/vehicle.model');
const Booking = require('../../models/customers/booking.model');

// ==========================================
// COMMON ERROR HANDLER
// ==========================================

const createError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// ==========================================
// VALIDATE OBJECT ID
// ==========================================

const validateObjectId = (id, fieldName) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw createError(`Invalid ${fieldName}`, 400);
    }
};

// ==========================================
// GENERATE ALLOCATION NUMBER
// ==========================================

const generateAllocationNumber = async () => {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const prefix = `ALLOC-${year}${month}${day}`;

    const count = await VehicleAllocation.countDocuments({
        allocationNumber: new RegExp(`^${prefix}-`)
    });

    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
};

// ==========================================
// CONVERT VEHICLE CAPACITY INTO KG
// ==========================================

const getVehicleCapacityInKg = (capacity) => {
    if (!capacity || typeof capacity.value !== 'number') {
        throw createError('Vehicle capacity information is invalid', 400);
    }

    if (capacity.unit === 'Ton') {
        return capacity.value * 1000;
    }

    if (capacity.unit === 'KG') {
        return capacity.value;
    }

    if (capacity.unit === 'Litre') {
        throw createError(
            'Litre-based vehicle capacity cannot be used for weight-based cargo allocation',
            400
        );
    }

    throw createError('Unsupported vehicle capacity unit', 400);
};

// ==========================================
// 1. CREATE VEHICLE ALLOCATION
// ==========================================

const createVehicleAllocation = async (allocationData, allocatedBy = null) => {
    const {
        bookingId,
        vehicleId,
        plannedPickupDate,
        plannedDeliveryDate,
        remarks
    } = allocationData;

    validateObjectId(bookingId, 'booking ID');
    validateObjectId(vehicleId, 'vehicle ID');

    // Check booking
    const booking = await Booking.findOne({
        _id: bookingId,
        isArchived: false
    });

    if (!booking) {
        throw createError('Booking not found', 404);
    }

    // Only confirmed bookings can be allocated
    if (booking.bookingStatus !== 'confirmed') {
        throw createError(
            'Only confirmed bookings can be allocated',
            400
        );
    }

    // Check planned dates against booking schedule
    const pickupDate = new Date(plannedPickupDate);
    const deliveryDate = new Date(plannedDeliveryDate);

    if (deliveryDate <= pickupDate) {
        throw createError(
            'Delivery date must be after pickup date',
            400
        );
    }

    if (
        pickupDate < new Date(booking.schedule.pickupDate) ||
        deliveryDate > new Date(booking.schedule.expectedDeliveryDate)
    ) {
        throw createError(
            'Allocation dates must be within the booking schedule',
            400
        );
    }

    // Check vehicle
    const vehicle = await Vehicle.findOne({
        _id: vehicleId,
        isDeleted: false
    });

    if (!vehicle) {
        throw createError('Vehicle not found', 404);
    }

    if (vehicle.vehicleStatus !== 'Available') {
        throw createError(
            `Vehicle is not available. Current status: ${vehicle.vehicleStatus}`,
            400
        );
    }

    // Check vehicle type
    if (
        booking.vehicleRequirement.vehicleType !== vehicle.vehicleType
    ) {
        throw createError(
            'Vehicle type does not match booking requirement',
            400
        );
    }

    // Check vehicle capacity
    const vehicleCapacityKg = getVehicleCapacityInKg(vehicle.capacity);

    const requiredCapacityKg = Math.max(
        booking.cargo.weightKg,
        booking.vehicleRequirement.minCapacityKg || 0
    );

    if (vehicleCapacityKg < requiredCapacityKg) {
        throw createError(
            `Vehicle capacity is insufficient. Required: ${requiredCapacityKg} KG, Available: ${vehicleCapacityKg} KG`,
            400
        );
    }

    // Check preferred vehicle number, if provided
    const preferredVehicleNumber =
        booking.vehicleRequirement.preferredVehicleNumber;

    if (
        preferredVehicleNumber &&
        preferredVehicleNumber !== vehicle.registrationNumber
    ) {
        throw createError(
            `Booking requires preferred vehicle ${preferredVehicleNumber}`,
            400
        );
    }

    // Check overlapping active allocations
    const overlappingAllocation = await VehicleAllocation.findOne({
        vehicleId,
        allocationStatus: 'Allocated',
        isDeleted: false,
        plannedPickupDate: { $lt: deliveryDate },
        plannedDeliveryDate: { $gt: pickupDate }
    });

    if (overlappingAllocation) {
        throw createError(
            'Vehicle already has an allocation during this period',
            409
        );
    }

    // Generate allocation reference
    const allocationNumber = await generateAllocationNumber();

    // Create allocation
    const allocation = await VehicleAllocation.create({
        allocationNumber,
        bookingId,
        vehicleId,
        plannedPickupDate: pickupDate,
        plannedDeliveryDate: deliveryDate,
        allocatedBy,
        remarks
    });

    // Update vehicle operational status
    vehicle.vehicleStatus = 'Allocated';
    await vehicle.save();

    return allocation;
};

// ==========================================
// 2. GET ALL VEHICLE ALLOCATIONS
// ==========================================

const getAllVehicleAllocations = async (queryParams) => {
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);

    const limit = Math.min(
        100,
        Math.max(1, parseInt(queryParams.limit, 10) || 10)
    );

    const skip = (page - 1) * limit;

    const filter = {
        isDeleted: false
    };

    if (queryParams.allocationStatus) {
        filter.allocationStatus = queryParams.allocationStatus;
    }

    if (queryParams.vehicleId) {
        validateObjectId(queryParams.vehicleId, 'vehicle ID');
        filter.vehicleId = queryParams.vehicleId;
    }

    if (queryParams.bookingId) {
        validateObjectId(queryParams.bookingId, 'booking ID');
        filter.bookingId = queryParams.bookingId;
    }

    const [allocations, totalAllocations] = await Promise.all([
        VehicleAllocation.find(filter)
            .populate('bookingId', 'bookingNumber bookingStatus customerId')
            .populate('vehicleId', 'registrationNumber vehicleType manufacturer model')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),

        VehicleAllocation.countDocuments(filter)
    ]);

    return {
        allocations,
        pagination: {
            totalAllocations,
            currentPage: page,
            totalPages: Math.ceil(totalAllocations / limit),
            pageLimit: limit
        }
    };
};

// ==========================================
// 3. GET ALLOCATION BY ID
// ==========================================

const getVehicleAllocationById = async (allocationId) => {
    validateObjectId(allocationId, 'allocation ID');

    const allocation = await VehicleAllocation.findOne({
        _id: allocationId,
        isDeleted: false
    })
        .populate('bookingId')
        .populate('vehicleId')
        .lean();

    if (!allocation) {
        throw createError('Vehicle allocation not found', 404);
    }

    return allocation;
};

// ==========================================
// 4. RELEASE / CANCEL ALLOCATION
// ==========================================

const updateAllocationStatus = async (
    allocationId,
    statusData,
    releasedBy = null
) => {
    validateObjectId(allocationId, 'allocation ID');

    const { allocationStatus, remarks } = statusData;

    const allocation = await VehicleAllocation.findOne({
        _id: allocationId,
        isDeleted: false
    });

    if (!allocation) {
        throw createError('Vehicle allocation not found', 404);
    }

    if (allocation.allocationStatus !== 'Allocated') {
        throw createError(
            'Only active allocations can be released or cancelled',
            400
        );
    }

    allocation.allocationStatus = allocationStatus;
    allocation.remarks = remarks || allocation.remarks;
    allocation.releasedAt = new Date();
    allocation.releasedBy = releasedBy;

    await allocation.save();

    // Check if another active allocation exists
    const anotherActiveAllocation = await VehicleAllocation.exists({
        _id: { $ne: allocation._id },
        vehicleId: allocation.vehicleId,
        allocationStatus: 'Allocated',
        isDeleted: false
    });

    if (!anotherActiveAllocation) {
        await Vehicle.updateOne(
            {
                _id: allocation.vehicleId,
                vehicleStatus: 'Allocated',
                isDeleted: false
            },
            {
                $set: {
                    vehicleStatus: 'Available'
                }
            }
        );
    }

    return allocation;
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    createVehicleAllocation,
    getAllVehicleAllocations,
    getVehicleAllocationById,
    updateAllocationStatus
};
