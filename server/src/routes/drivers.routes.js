const express = require('express');

const driverController = require('../controllers/driver/driverAuth.controller');
const { verifyAccessToken, requireRole, STAFF_ROLES, scopeToSignedInDriver } = require('../middlewares/auth.middleware');
const { validate, validateQuery } = require('../middlewares/validation.middleware');
const {
  createDriverSchema,
  updateDriverSchema,
  updateDriverStatusSchema,
  driverLicenseSchema,
  updateDriverLicenseSchema,
  updateLicenseStatusSchema,
  driverDocumentSchema,
  updateDriverDocumentSchema,
  attendanceSchema,
  updateAttendanceSchema,
  updateAttendanceStatusSchema,
  driverPaymentSchema,
  updateDriverPaymentSchema,
  updateDriverPaymentStatusSchema,
  driverListQuerySchema,
  licenseListQuerySchema,
  documentListQuerySchema,
  attendanceListQuerySchema,
  paymentListQuerySchema,
  performanceQuerySchema,
} = require('../validations/driver/driver.validation');

const router = express.Router();

const staffOnly = requireRole(...STAFF_ROLES);
// Drivers can read their own licence, document, attendance and payment records (scoped to their ID).
const staffOrDriver = requireRole(...STAFF_ROLES, 'driver');

router.use(verifyAccessToken);

router.get('/performance', staffOnly, validateQuery(performanceQuerySchema), driverController.getDriverPerformanceReport);

router.get('/licenses', staffOrDriver, validateQuery(licenseListQuerySchema), scopeToSignedInDriver, driverController.listDriverLicenses);
router.post('/licenses', staffOnly, validate(driverLicenseSchema), driverController.createDriverLicense);
router.patch('/licenses/:recordId', staffOnly, validate(updateDriverLicenseSchema), driverController.updateDriverLicense);
router.patch('/licenses/:recordId/status', staffOnly, validate(updateLicenseStatusSchema), driverController.updateDriverLicense);
router.delete('/licenses/:recordId', staffOnly, driverController.deleteDriverLicense);

router.get('/documents', staffOrDriver, validateQuery(documentListQuerySchema), scopeToSignedInDriver, driverController.listDriverDocuments);
router.post('/documents', staffOnly, validate(driverDocumentSchema), driverController.createDriverDocument);
router.patch('/documents/:recordId', staffOnly, validate(updateDriverDocumentSchema), driverController.updateDriverDocument);
router.delete('/documents/:recordId', staffOnly, driverController.deleteDriverDocument);

router.get('/attendance', staffOrDriver, validateQuery(attendanceListQuerySchema), scopeToSignedInDriver, driverController.listDriverAttendance);
router.post('/attendance', staffOnly, validate(attendanceSchema), driverController.createDriverAttendance);
router.patch('/attendance/:recordId', staffOnly, validate(updateAttendanceSchema), driverController.updateDriverAttendance);
router.patch('/attendance/:recordId/status', staffOnly, validate(updateAttendanceStatusSchema), driverController.updateDriverAttendance);
router.delete('/attendance/:recordId', staffOnly, driverController.deleteDriverAttendance);

router.get('/payments', staffOrDriver, validateQuery(paymentListQuerySchema), scopeToSignedInDriver, driverController.listDriverPayments);
router.post('/payments', staffOnly, validate(driverPaymentSchema), driverController.createDriverPayment);
router.patch('/payments/:recordId', staffOnly, validate(updateDriverPaymentSchema), driverController.updateDriverPayment);
router.patch('/payments/:recordId/status', staffOnly, validate(updateDriverPaymentStatusSchema), driverController.updateDriverPaymentStatus);
router.delete('/payments/:recordId', staffOnly, driverController.deleteDriverPayment);

router.get('/', staffOnly, validateQuery(driverListQuerySchema), driverController.getAllDrivers);
router.post('/', staffOnly, validate(createDriverSchema), driverController.createDriver);
router.get('/:driverId', staffOnly, driverController.getDriverById);
router.patch('/:driverId/status', staffOnly, validate(updateDriverStatusSchema), driverController.updateDriverStatus);
router.patch('/:driverId', staffOnly, validate(updateDriverSchema), driverController.updateDriver);
router.delete('/:driverId', staffOnly, driverController.deleteDriver);

module.exports = router;
