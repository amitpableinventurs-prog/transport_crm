const express = require('express');
const router = express.Router();

const managementController = require('../../controllers/customers/management.controller');
const { verifyAccessToken, requireRole } = require('../../middlewares/auth.middleware');

router.use(verifyAccessToken, requireRole('admin'));

router.get('/summary', managementController.getCustomerSummary);
router.get('/registrations', managementController.listCustomers);
router.post('/registrations', managementController.createCustomerRegistration);
router.put('/registrations/:id', managementController.updateCustomerRegistration);
router.get('/', managementController.listCustomers);
router.get('/:id/kyc/documents', managementController.listCustomerKycDocuments);
router.patch('/:id/kyc/documents/:documentId/review', managementController.reviewCustomerKycDocument);
router.get('/:id/kyc/documents/:documentId/download', managementController.downloadCustomerKycDocument);
router.patch('/:id/kyc', managementController.reviewCustomerKyc);
router.get('/:id/activities', managementController.listCustomerActivities);
router.post('/:id/activities', managementController.createCustomerActivity);
router.patch('/:id/activities/:activityId/complete', managementController.completeCustomerFollowUp);
router.get('/:id', managementController.getCustomerById);
router.patch('/:id/status', managementController.updateCustomerStatus);
router.put('/:id', managementController.updateCustomerProfile);

module.exports = router;
