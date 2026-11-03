const bookingService = require('../../services/customers/booking.service');

// Common error response handler
const handleError = (res, error) => {
    console.error('Booking Controller Error:', error);

    return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Internal Server Error'
    });
};


// ======================================================
// 1. CREATE VEHICLE BOOKING
// Customer vehicle booking request
// ======================================================

exports.createVehicleBooking = async (req, res) => {
    try {
        const customerId = req.user.id;

        const bookingData = {
            pickupAddress: req.body.pickupAddress,
            deliveryAddress: req.body.deliveryAddress,
            cargo: req.body.cargo,
            vehicleRequirement: req.body.vehicleRequirement,
            schedule: req.body.schedule,
            branchId: req.body.branchId
        };

        const booking = await bookingService.createVehicleBooking(
            customerId,
            bookingData
        );

        return res.status(201).json({
            success: true,
            message: 'Vehicle booking request created successfully',
            data: booking
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// ======================================================
// 2. CREATE ONLINE BOOKING
// Online booking request
// ======================================================

exports.createOnlineBooking = async (req, res) => {
    try {
        const customerId = req.user.id;

        const bookingData = {
            pickupAddress: req.body.pickupAddress,
            deliveryAddress: req.body.deliveryAddress,
            cargo: req.body.cargo,
            vehicleRequirement: req.body.vehicleRequirement,
            schedule: req.body.schedule,
            branchId: req.body.branchId
        };

        const booking = await bookingService.createOnlineBooking(
            customerId,
            bookingData
        );

        return res.status(201).json({
            success: true,
            message: 'Online booking created successfully',
            data: booking
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// ======================================================
// 3. GET CUSTOMER BOOKINGS
// Logged-in customer booking list
// ======================================================

exports.getCustomerBookings = async (req, res) => {
    try {
        const customerId = req.user.id;

        const filters = {
            page: req.query.page,
            limit: req.query.limit,
            bookingStatus: req.query.status
        };

        const bookings = await bookingService.getCustomerBookings(
            customerId,
            filters
        );

        return res.status(200).json({
            success: true,
            message: 'Bookings fetched successfully',
            data: bookings
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// ======================================================
// 4. GET CUSTOMER BOOKING DETAILS
// Single booking details
// ======================================================

exports.getCustomerBookingById = async (req, res) => {
    try {
        const customerId = req.user.id;
        const bookingId = req.params.bookingId;

        const booking = await bookingService.getCustomerBookingById(
            customerId,
            bookingId
        );

        return res.status(200).json({
            success: true,
            message: 'Booking details fetched successfully',
            data: booking
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// ======================================================
// 5. GET BOOKING CALENDAR
// Booking calendar data
// ======================================================

exports.getBookingCalendar = async (req, res) => {
    try {
        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            status: req.query.status,
            branchId: req.query.branchId
        };

        const calendar = await bookingService.getBookingCalendar(
            filters.startDate,
            filters.endDate,
            { bookingStatus: filters.status, branchId: filters.branchId }
        );

        return res.status(200).json({
            success: true,
            message: 'Booking calendar fetched successfully',
            data: calendar
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// ======================================================
// 6. UPDATE BOOKING STATUS
// Admin / Transport Manager booking status update
// ======================================================

exports.updateBookingStatus = async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const changedBy = req.user.id;

        const statusData = {
            status: req.body.status,
            remarks: req.body.remarks
        };

        const booking = await bookingService.updateBookingStatus(
            bookingId,
            statusData.status,
            changedBy,
            statusData.remarks || '',
            req.user.role
        );

        return res.status(200).json({
            success: true,
            message: 'Booking status updated successfully',
            data: booking
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// ======================================================
// 7. GET BOOKING STATUS HISTORY
// Booking status tracking history
// ======================================================

exports.getBookingStatusHistory = async (req, res) => {
    try {
        const customerId = req.user.id;
        const bookingId = req.params.bookingId;

        const history = await bookingService.getBookingStatusHistory(customerId, bookingId);

        return res.status(200).json({
            success: true,
            message: 'Booking status history fetched successfully',
            data: history
        });

    } catch (error) {
        return handleError(res, error);
    }
};