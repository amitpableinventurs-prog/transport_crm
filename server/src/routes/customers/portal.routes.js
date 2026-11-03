 const express = require('express');
const router = express.Router();

const portalController = require('../../controllers/customers/portal.controller');
const { verifyAccessToken, requireRole } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { validateKycSubmission } = require('../../validations/customers/auth.validation');
const { uploadKycDocument } = require('../../middlewares/kyc-upload.middleware');
const {
	validateUpdateProfile,
	validateAddress,
	validatePreferences
} = require('../../validations/customers/portal.validation');

router.use(verifyAccessToken, requireRole('customer'));

// Customer Dashboard
router.get('/dashboard',portalController.getDashboard);

// Customer Profile
router.get('/profile', portalController.getProfile);
router.put('/profile', validate(validateUpdateProfile), portalController.updateProfile);
router.post('/kyc/submit', validate(validateKycSubmission), portalController.submitKyc);
router.post('/kyc/documents', uploadKycDocument, portalController.uploadKycDocument);
router.get('/kyc/documents', portalController.listKycDocuments);
router.get('/kyc/documents/:documentId/download', portalController.downloadKycDocument);

// Customer Preferences
router.get('/preferences', portalController.getPreferences);
router.put('/preferences', validate(validatePreferences), portalController.updatePreferences);

// Customer Addresses
router.get('/addresses', portalController.listAddresses);
router.post('/addresses', validate(validateAddress), portalController.addAddress);
router.put('/addresses/:id', validate(validateAddress), portalController.updateAddress);
router.delete('/addresses/:id', portalController.deleteAddress);

module.exports = router;