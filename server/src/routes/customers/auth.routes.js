const express = require('express');
const router = express.Router();
const authController = require('../../controllers/customers/auth.controller');
const { verifyAccessToken, requireRole } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { 
    validateSendOtp, 
    validateVerifyOtp, 
    validateRefreshToken, 
    validateCompleteProfile 
} = require('../../validations/customers/auth.validation');

// Public Routes
router.post('/send-otp', validate(validateSendOtp), authController.sendOtp);
router.post('/verify-otp', validate(validateVerifyOtp), authController.verifyOtp);
router.post('/refresh-token', validate(validateRefreshToken), authController.refreshTokenController);

// Protected Routes
router.post('/complete-profile', verifyAccessToken, requireRole('customer'), validate(validateCompleteProfile), authController.completeProfile);
router.get('/profile', verifyAccessToken, requireRole('customer'), authController.getProfile);
router.post('/logout', verifyAccessToken, requireRole('customer'), authController.logout);

module.exports = router;