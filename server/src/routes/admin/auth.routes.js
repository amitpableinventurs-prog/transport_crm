const express = require('express');
const router = express.Router();
const authController = require('../../controllers/admin/auth.controller');
const { validate } = require('../../middlewares/validation.middleware');
const { validateAdminOtpRequest, validateAdminOtpVerification } = require('../../validations/admin/auth.validation');

router.post('/send-otp', validate(validateAdminOtpRequest), authController.sendOtp);
router.post('/verify-otp', validate(validateAdminOtpVerification), authController.verifyOtp);

module.exports = router;