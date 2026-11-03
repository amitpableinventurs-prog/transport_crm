
const mongoose = require('mongoose');
const crypto = require('crypto');

const Booking = require('../../models/customers/booking.model');
const { Customer } = require('../../models/customers/auth.model');

// ============================================================
// 1. COMMON HELPERS
// Reusable functions used by different booking operations.
// ============================================================

// Check whether a value is a valid MongoDB ObjectId.
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Create a unique booking number.
// Example: BK-20261030-A1B2C3D4
const generateBookingNumber = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();

    return `BK-${date}-${random}`;
};

// Verify that the customer exists and is allowed to book.
const verifyCustomer = async (customerId, { forBooking = false } = {}) => {
    if (!isValidId(customerId)) {
        throw Object.assign(new Error('Invalid customer ID'), {
            statusCode: 400
        });
    }

    const customer = await Customer.findById(customerId);

    if (!customer) {
        throw Object.assign(new Error('Customer not found'), {
            statusCode: 404
        });
    }

    if (customer.status === 'Suspended') {
        throw Object.assign(new Error('Customer account is suspended'), {
            statusCode: 403
        });
    }

    if (forBooking && customer.status !== 'Active') {
        throw Object.assign(new Error('Customer account must be active before booking'), {
            statusCode: 403
        });
    }
    if (forBooking && !customer.isProfileComplete) {
        throw Object.assign(new Error('Complete your customer profile before booking'), {
            statusCode: 409
        });
    }
    if (forBooking && customer.kycStatus !== 'Verified') {
        throw Object.assign(new Error('KYC must be verified before booking'), {
            statusCode: 403
        });
    }

    return customer;
};

// ============================================================
// 2. VEHICLE BOOKING
// Customer submits a vehicle and transportation requirement.
// Actual vehicle allocation will happen later in Fleet Management.
// ============================================================

const createVehicleBooking = async (customerId, bookingData) => {
    await verifyCustomer(customerId, { forBooking: true });

    // Only accept fields that a customer is allowed to submit.
    // Booking status, booking number and charges are controlled by the system.
    const booking = await Booking.create({
        bookingNumber: generateBookingNumber(),
        customerId,

        bookingSource: 'customer_portal',

        pickupAddress: bookingData.pickupAddress,
        deliveryAddress: bookingData.deliveryAddress,

        cargo: bookingData.cargo,
        vehicleRequirement: bookingData.vehicleRequirement,
        schedule: bookingData.schedule,

        bookingStatus: 'pending',

        createdBy: customerId,

        statusHistory: [
            {
                status: 'pending',
                changedBy: customerId,
                changedByRole: 'customer',
                changedByActor: String(customerId),
                remarks: 'Vehicle booking request submitted'
            }
        ]
    });

    return booking;
};

// ============================================================
// 3. ONLINE BOOKING
// Booking submitted through the website or online booking form.
// It uses the same Booking model as vehicle booking.
// ============================================================

const createOnlineBooking = async (customerId, bookingData) => {
    await verifyCustomer(customerId, { forBooking: true });

    const booking = await Booking.create({
        bookingNumber: generateBookingNumber(),
        customerId,

        bookingSource: 'online',

        pickupAddress: bookingData.pickupAddress,
        deliveryAddress: bookingData.deliveryAddress,

        cargo: bookingData.cargo,
        vehicleRequirement: bookingData.vehicleRequirement,
        schedule: bookingData.schedule,

        bookingStatus: 'pending',

        createdBy: customerId,

        statusHistory: [
            {
                status: 'pending',
                changedBy: customerId,
                changedByRole: 'customer',
                changedByActor: String(customerId),
                remarks: 'Online booking request submitted'
            }
        ]
    });

    return booking;
};

// ============================================================
// 4. CUSTOMER BOOKING LIST
// Customer can see only their own bookings.
// Pagination prevents loading too many records at once.
// ============================================================

const getCustomerBookings = async (customerId, options = {}) => {
    await verifyCustomer(customerId);

    const page = Math.max(parseInt(options.page, 10) || 1, 1);

    const limit = Math.min(
        Math.max(parseInt(options.limit, 10) || 10, 1),
        100
    );

    const skip = (page - 1) * limit;

    const query = {
        customerId,
        isArchived: false
    };

    // Optional filter to show bookings of a particular status.
    if (options.bookingStatus) {
        query.bookingStatus = options.bookingStatus;
    }

    const [bookings, total] = await Promise.all([
        Booking.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),

        Booking.countDocuments(query)
    ]);

    return {
        bookings,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

// ============================================================
// 5. CUSTOMER BOOKING DETAILS
// Fetch one booking belonging to the logged-in customer.
// ============================================================

const getCustomerBookingById = async (customerId, bookingId) => {
    await verifyCustomer(customerId);

    if (!isValidId(bookingId)) {
        throw Object.assign(new Error('Invalid booking ID'), {
            statusCode: 400
        });
    }

    const booking = await Booking.findOne({
        _id: bookingId,
        customerId,
        isArchived: false
    }).lean();

    if (!booking) {
        throw Object.assign(new Error('Booking not found'), {
            statusCode: 404
        });
    }

    return booking;
};

// ============================================================
// 6. BOOKING CALENDAR
// Transport Manager can view bookings according to pickup dates.
// Optional filters: booking status and branch.
// ============================================================

const getBookingCalendar = async (startDate, endDate, filters = {}) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
        !startDate ||
        !endDate ||
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {
        throw Object.assign(
            new Error('Valid start date and end date are required'),
            { statusCode: 400 }
        );
    }

    if (start > end) {
        throw Object.assign(
            new Error('Start date cannot be after end date'),
            { statusCode: 400 }
        );
    }

    // Include the complete end date in the calendar search.
    end.setHours(23, 59, 59, 999);

    const query = {
        'schedule.pickupDate': {
            $gte: start,
            $lte: end
        },
        isArchived: false
    };

    if (filters.bookingStatus) {
        query.bookingStatus = filters.bookingStatus;
    }

    if (filters.branchId) {
        if (!isValidId(filters.branchId)) {
            throw Object.assign(new Error('Invalid branch ID'), {
                statusCode: 400
            });
        }

        query.branchId = filters.branchId;
    }

    const bookings = await Booking.find(query)
        .select(
            'bookingNumber customerId pickupAddress deliveryAddress schedule bookingStatus vehicleRequirement'
        )
        .sort({ 'schedule.pickupDate': 1 })
        .lean();

    return bookings;
};

// ============================================================
// 7. BOOKING STATUS MANAGEMENT
// Only allowed status transitions can be performed.
// Role permissions will also be enforced in middleware/controller.
// ============================================================

const allowedTransitions = {
    draft: ['pending', 'cancelled'],
    pending: ['under_review', 'quoted', 'rejected', 'cancelled'],
    under_review: ['quoted', 'rejected', 'cancelled'],
    quoted: ['confirmed', 'rejected', 'cancelled', 'expired'],
    confirmed: ['cancelled'],
    rejected: [],
    cancelled: [],
    expired: []
};

const updateBookingStatus = async (
    bookingId,
    newStatus,
    changedBy = null,
    remarks = '',
    changedByRole = 'admin'
) => {
    if (!isValidId(bookingId)) {
        throw Object.assign(new Error('Invalid booking ID'), {
            statusCode: 400
        });
    }

    const validStatuses = Object.keys(allowedTransitions);

    if (!validStatuses.includes(newStatus)) {
        throw Object.assign(new Error('Invalid booking status'), {
            statusCode: 400
        });
    }

    const changedByObjectId = changedBy && isValidId(changedBy) ? changedBy : null;
    if (changedBy && !changedByObjectId && changedByRole !== 'admin') {
        throw Object.assign(new Error('Invalid user ID'), {
            statusCode: 400
        });
    }

    const booking = await Booking.findOne({
        _id: bookingId,
        isArchived: false
    });

    if (!booking) {
        throw Object.assign(new Error('Booking not found'), {
            statusCode: 404
        });
    }

    const currentStatus = booking.bookingStatus;

    if (currentStatus === newStatus) {
        throw Object.assign(
            new Error('Booking already has this status'),
            { statusCode: 400 }
        );
    }

    // Prevent invalid status changes.
    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
        throw Object.assign(
            new Error(
                `Cannot change booking status from ${currentStatus} to ${newStatus}`
            ),
            { statusCode: 400 }
        );
    }

    booking.bookingStatus = newStatus;
    booking.updatedBy = changedByObjectId;

    // Maintain a record of every status change.
    booking.statusHistory.push({
        status: newStatus,
        changedBy: changedByObjectId,
        changedByRole,
        changedByActor: String(changedBy || ''),
        remarks: remarks || `Status changed from ${currentStatus} to ${newStatus}`
    });

    // Save cancellation details when booking is cancelled.
    if (newStatus === 'cancelled') {
        booking.cancellation.reason = remarks;
        booking.cancellation.cancelledBy = changedByObjectId;
        booking.cancellation.cancelledAt = new Date();
    }

    await booking.save();

    return booking;
};

// ============================================================
// 8. BOOKING STATUS HISTORY
// Fetch the complete status timeline of a booking.
// ============================================================

const getBookingStatusHistory = async (customerId, bookingId) => {
    await verifyCustomer(customerId);
    if (!isValidId(bookingId)) {
        throw Object.assign(new Error('Invalid booking ID'), {
            statusCode: 400
        });
    }

    const booking = await Booking.findOne({
        _id: bookingId,
        customerId,
        isArchived: false
    })
        .select('bookingNumber bookingStatus statusHistory')
        .lean();

    if (!booking) {
        throw Object.assign(new Error('Booking not found'), {
            statusCode: 404
        });
    }

    return booking;
};

// ============================================================
// EXPORTS
// Controllers will import these functions from this single file.
// ============================================================

module.exports = {
    createVehicleBooking,
    createOnlineBooking,
    getCustomerBookings,
    getCustomerBookingById,
    getBookingCalendar,
    updateBookingStatus,
    getBookingStatusHistory
};
