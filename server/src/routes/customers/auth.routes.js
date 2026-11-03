const express = require('express');
const router = express.Router();
const authController = require('../../controllers/customers/auth.controller');
const { verifyAccessToken, requireRole } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { validateCompleteProfile } = require('../../validations/customers/auth.validation');

// Customers sign in through POST /api/v1/auth/login (login ID + password) like every other role.
router.post('/complete-profile', verifyAccessToken, requireRole('customer'), validate(validateCompleteProfile), authController.completeProfile);
router.get('/profile', verifyAccessToken, requireRole('customer'), authController.getProfile);

module.exports = router;