const express = require('express');
const router = express.Router();

const bookingController = require('../../controllers/customers/booking.controller');

const {
    verifyAccessToken,
    requireRole
} = require('../../middlewares/auth.middleware');

const {
    validateCreateBooking,
    validateBookingId,
    validateBookingListQuery,
    validateBookingCalendarQuery,
    validateUpdateBookingStatus
} = require('../../validations/customers/booking.validator');


// ======================================================
// AUTHENTICATION
// All booking routes require login
// ======================================================

router.get(
    '/calendar',
    verifyAccessToken,
    requireRole('admin'),
    validateBookingCalendarQuery,
    bookingController.getBookingCalendar
);

router.patch(
    '/:bookingId/status',
    verifyAccessToken,
    requireRole('admin'),
    validateBookingId,
    validateUpdateBookingStatus,
    bookingController.updateBookingStatus
);

router.use(verifyAccessToken, requireRole('customer'));


// ======================================================
// 1. CREATE VEHICLE BOOKING
// POST /api/v1/customers/booking/vehicle
// ======================================================

router.post(
    '/vehicle',
    validateCreateBooking,
    bookingController.createVehicleBooking
);


// ======================================================
// 2. CREATE ONLINE BOOKING
// POST /api/v1/customers/booking/online
// ======================================================

router.post(
    '/online',
    validateCreateBooking,
    bookingController.createOnlineBooking
);


// ======================================================
// 3. GET CUSTOMER BOOKINGS
// GET /api/v1/customers/booking
// ======================================================

router.get(
    '/',
    validateBookingListQuery,
    bookingController.getCustomerBookings
);


// ======================================================
// 5. GET BOOKING STATUS HISTORY
// GET /api/v1/customers/booking/:bookingId/history
// ======================================================

router.get(
    '/:bookingId/history',
    validateBookingId,
    bookingController.getBookingStatusHistory
);


// ======================================================
// 6. GET BOOKING DETAILS
// GET /api/v1/customers/booking/:bookingId
// ======================================================

router.get(
    '/:bookingId',
    validateBookingId,
    bookingController.getCustomerBookingById
);


module.exports = router;