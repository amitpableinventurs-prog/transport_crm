
const driverService = require('../../services/driver/driverAuth.service');
const driverRecordsService = require('../../services/driver/driverRecords.service');

const respondWithRecord = (action, message, statusCode = 200) => async (req, res, next) => {
  try {
    const data = await action(req);
    res.status(statusCode).json({ success: true, message, data });
  } catch (error) {
    next(error);
  }
};

const userId = (req) => req.user?.id || req.user?._id || null;

// Create Driver
const createDriver = async (req, res, next) => {
  try {
    const driver = await driverService.createDriver(
      req.body,
      userId(req)
    );

    res.status(201).json({
      success: true,
      message: 'Driver registered successfully',
      data: driver,
    });
  } catch (error) {
    next(error);
  }
};

// Get All Drivers
const getAllDrivers = async (req, res, next) => {
  try {
    const result = await driverService.getAllDrivers(req.validatedQuery || req.query);

    res.status(200).json({
      success: true,
      message: 'Drivers fetched successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// Get Driver By ID
const getDriverById = async (req, res, next) => {
  try {
    const driver = await driverService.getDriverById(
      req.params.driverId
    );

    res.status(200).json({
      success: true,
      message: 'Driver details fetched successfully',
      data: driver,
    });
  } catch (error) {
    next(error);
  }
};

// Update Driver
const updateDriver = async (req, res, next) => {
  try {
    const driver = await driverService.updateDriver(
      req.params.driverId,
      req.body,
      userId(req)
    );

    res.status(200).json({
      success: true,
      message: 'Driver updated successfully',
      data: driver,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Driver (Soft Delete)
const deleteDriver = async (req, res, next) => {
  try {
    await driverService.deleteDriver(req.params.driverId);

    res.status(200).json({
      success: true,
      message: 'Driver deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const updateDriverStatus = async (req, res, next) => {
  try {
    const driver = await driverService.updateDriverStatus(
      req.params.driverId,
      req.body.driverStatus,
      userId(req)
    );
    res.status(200).json({ success: true, message: 'Driver status updated successfully', data: driver });
  } catch (error) {
    next(error);
  }
};

const listDriverLicenses = respondWithRecord(
  (req) => driverRecordsService.listDriverLicenses(req.validatedQuery || req.query),
  'Driver licences fetched successfully'
);
const createDriverLicense = respondWithRecord(
  (req) => driverRecordsService.createDriverLicense(req.body, userId(req)),
  'Driver licence created successfully',
  201
);
const updateDriverLicense = respondWithRecord(
  (req) => driverRecordsService.updateDriverLicense(req.params.recordId, req.body, userId(req)),
  'Driver licence updated successfully'
);
const deleteDriverLicense = respondWithRecord(
  (req) => driverRecordsService.deleteDriverLicense(req.params.recordId),
  'Driver licence deleted successfully'
);

const listDriverDocuments = respondWithRecord(
  (req) => driverRecordsService.listDriverDocuments(req.validatedQuery || req.query),
  'Driver documents fetched successfully'
);
const createDriverDocument = respondWithRecord(
  (req) => driverRecordsService.createDriverDocument(req.body, userId(req)),
  'Driver document created successfully',
  201
);
const updateDriverDocument = respondWithRecord(
  (req) => driverRecordsService.updateDriverDocument(req.params.recordId, req.body, userId(req)),
  'Driver document updated successfully'
);
const deleteDriverDocument = respondWithRecord(
  (req) => driverRecordsService.deleteDriverDocument(req.params.recordId),
  'Driver document deleted successfully'
);

const listDriverAttendance = respondWithRecord(
  (req) => driverRecordsService.listDriverAttendance(req.validatedQuery || req.query),
  'Driver attendance fetched successfully'
);
const createDriverAttendance = respondWithRecord(
  (req) => driverRecordsService.createDriverAttendance(req.body, userId(req)),
  'Driver attendance recorded successfully',
  201
);
const updateDriverAttendance = respondWithRecord(
  (req) => driverRecordsService.updateDriverAttendance(req.params.recordId, req.body, userId(req)),
  'Driver attendance updated successfully'
);
const deleteDriverAttendance = respondWithRecord(
  (req) => driverRecordsService.deleteDriverAttendance(req.params.recordId),
  'Driver attendance deleted successfully'
);

const listDriverPayments = respondWithRecord(
  (req) => driverRecordsService.listDriverPayments(req.validatedQuery || req.query),
  'Driver payments fetched successfully'
);
const createDriverPayment = respondWithRecord(
  (req) => driverRecordsService.createDriverPayment(req.body, userId(req)),
  'Driver payment created successfully',
  201
);
const updateDriverPayment = respondWithRecord(
  (req) => driverRecordsService.updateDriverPayment(req.params.recordId, req.body, userId(req)),
  'Driver payment updated successfully'
);
const updateDriverPaymentStatus = respondWithRecord(
  (req) => driverRecordsService.updateDriverPaymentStatus(req.params.recordId, req.body.status, userId(req)),
  'Driver payment status updated successfully'
);
const deleteDriverPayment = respondWithRecord(
  (req) => driverRecordsService.deleteDriverPayment(req.params.recordId),
  'Driver payment deleted successfully'
);

const getDriverPerformanceReport = respondWithRecord(
  (req) => driverRecordsService.getDriverPerformanceReport(req.validatedQuery || req.query),
  'Attendance-based driver report fetched successfully'
);

module.exports = {
  createDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  updateDriverStatus,
  deleteDriver,
  listDriverLicenses,
  createDriverLicense,
  updateDriverLicense,
  deleteDriverLicense,
  listDriverDocuments,
  createDriverDocument,
  updateDriverDocument,
  deleteDriverDocument,
  listDriverAttendance,
  createDriverAttendance,
  updateDriverAttendance,
  deleteDriverAttendance,
  listDriverPayments,
  createDriverPayment,
  updateDriverPayment,
  updateDriverPaymentStatus,
  deleteDriverPayment,
  getDriverPerformanceReport,
};
