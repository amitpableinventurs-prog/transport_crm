const express = require('express');

const driverController = require('../controllers/driver/driverAuth.controller');
const { verifyAccessToken, requireRole } = require('../middlewares/auth.middleware');
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

router.use(verifyAccessToken, requireRole('admin'));

router.get('/performance', validateQuery(performanceQuerySchema), driverController.getDriverPerformanceReport);

router.get('/licenses', validateQuery(licenseListQuerySchema), driverController.listDriverLicenses);
router.post('/licenses', validate(driverLicenseSchema), driverController.createDriverLicense);
router.patch('/licenses/:recordId', validate(updateDriverLicenseSchema), driverController.updateDriverLicense);
router.patch('/licenses/:recordId/status', validate(updateLicenseStatusSchema), driverController.updateDriverLicense);
router.delete('/licenses/:recordId', driverController.deleteDriverLicense);

router.get('/documents', validateQuery(documentListQuerySchema), driverController.listDriverDocuments);
router.post('/documents', validate(driverDocumentSchema), driverController.createDriverDocument);
router.patch('/documents/:recordId', validate(updateDriverDocumentSchema), driverController.updateDriverDocument);
router.delete('/documents/:recordId', driverController.deleteDriverDocument);

router.get('/attendance', validateQuery(attendanceListQuerySchema), driverController.listDriverAttendance);
router.post('/attendance', validate(attendanceSchema), driverController.createDriverAttendance);
router.patch('/attendance/:recordId', validate(updateAttendanceSchema), driverController.updateDriverAttendance);
router.patch('/attendance/:recordId/status', validate(updateAttendanceStatusSchema), driverController.updateDriverAttendance);
router.delete('/attendance/:recordId', driverController.deleteDriverAttendance);

router.get('/payments', validateQuery(paymentListQuerySchema), driverController.listDriverPayments);
router.post('/payments', validate(driverPaymentSchema), driverController.createDriverPayment);
router.patch('/payments/:recordId', validate(updateDriverPaymentSchema), driverController.updateDriverPayment);
router.patch('/payments/:recordId/status', validate(updateDriverPaymentStatusSchema), driverController.updateDriverPaymentStatus);
router.delete('/payments/:recordId', driverController.deleteDriverPayment);

router.get('/', validateQuery(driverListQuerySchema), driverController.getAllDrivers);
router.post('/', validate(createDriverSchema), driverController.createDriver);
router.get('/:driverId', driverController.getDriverById);
router.patch('/:driverId/status', validate(updateDriverStatusSchema), driverController.updateDriverStatus);
router.patch('/:driverId', validate(updateDriverSchema), driverController.updateDriver);
router.delete('/:driverId', driverController.deleteDriver);

module.exports = router;
