const mongoose = require('mongoose');

const Driver = require('../../models/driver/driver.model');
const DriverLicense = require('../../models/driver/driver-license.model');
const DriverDocument = require('../../models/driver/driver-document.model');
const DriverAttendance = require('../../models/driver/driver-attendance.model');
const DriverPayment = require('../../models/driver/driver-payment.model');

const createError = (message, statusCode) => Object.assign(new Error(message), { statusCode });
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function validateObjectId(id, label) {
  if (!mongoose.isValidObjectId(id)) throw createError(`Invalid ${label}`, 400);
}

function getPagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

async function assertDriverExists(driverId) {
  validateObjectId(driverId, 'driver ID');
  const driver = await Driver.findOne({ _id: driverId, isDeleted: false }).select('_id driverStatus').lean();
  if (!driver) throw createError('Driver not found', 404);
  return driver;
}

async function listRecords(Model, query, { statusField, dateField, searchFields = [] } = {}) {
  const { page, limit, skip } = getPagination(query);
  const filter = { isDeleted: false };
  if (query.driverId) {
    validateObjectId(query.driverId, 'driver ID');
    filter.driverId = query.driverId;
  }
  if (statusField && query[statusField]) filter[statusField] = query[statusField];
  if (dateField) {
    const range = {};
    if (query.startDate) {
      const startDate = new Date(query.startDate);
      if (Number.isNaN(startDate.getTime())) throw createError('Invalid startDate', 400);
      range.$gte = startDate;
    }
    if (query.endDate) {
      const endDate = new Date(query.endDate);
      if (Number.isNaN(endDate.getTime())) throw createError('Invalid endDate', 400);
      endDate.setUTCHours(23, 59, 59, 999);
      range.$lte = endDate;
    }
    if (Object.keys(range).length) filter[dateField] = range;
  }
  if (query.search?.trim() && searchFields.length) {
    const regex = { $regex: escapeRegex(query.search.trim()), $options: 'i' };
    filter.$or = searchFields.map((field) => ({ [field]: regex }));
  }

  const [records, total] = await Promise.all([
    Model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Model.countDocuments(filter),
  ]);
  return {
    data: records,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

function normalizeAttendanceDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw createError('Invalid attendance date', 400);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function addNetAmount(record) {
  if (!record) return record;
  const value = typeof record.toObject === 'function' ? record.toObject() : record;
  return { ...value, netAmount: value.baseAmount + value.allowances - value.deductions };
}

function translateDuplicateError(error, message) {
  if (error?.code === 11000) throw createError(message, 409);
  throw error;
}

async function createRecord(Model, data, userId, options = {}) {
  await assertDriverExists(data.driverId);
  if (options.dateField) data[options.dateField] = normalizeAttendanceDate(data[options.dateField]);
  try {
    const record = await Model.create({
      ...data,
      createdBy: userId && mongoose.isValidObjectId(userId) ? userId : null,
    });
    return options.withNetAmount ? addNetAmount(record) : record;
  } catch (error) {
    translateDuplicateError(error, options.duplicateMessage);
  }
}

async function updateRecord(Model, recordId, data, userId, options = {}) {
  validateObjectId(recordId, options.label || 'record ID');
  if (data.driverId) await assertDriverExists(data.driverId);
  if (options.dateField && data[options.dateField]) {
    data[options.dateField] = normalizeAttendanceDate(data[options.dateField]);
  }
  try {
    const record = await Model.findOneAndUpdate(
      { _id: recordId, isDeleted: false },
      { $set: { ...data, updatedBy: userId && mongoose.isValidObjectId(userId) ? userId : null } },
      { new: true, runValidators: true }
    );
    if (!record) throw createError(`${options.label || 'Record'} not found`, 404);
    return options.withNetAmount ? addNetAmount(record) : record;
  } catch (error) {
    translateDuplicateError(error, options.duplicateMessage);
  }
}

async function deleteRecord(Model, recordId, label) {
  validateObjectId(recordId, `${label} ID`);
  const record = await Model.findOneAndUpdate(
    { _id: recordId, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );
  if (!record) throw createError(`${label} not found`, 404);
  return true;
}

const listDriverLicenses = (query) => listRecords(DriverLicense, query, {
  statusField: 'status',
  dateField: 'expiryDate',
  searchFields: ['licenseNumber'],
});
const createDriverLicense = (data, userId) => createRecord(DriverLicense, data, userId, {
  duplicateMessage: 'This driver already has a licence record with that number',
});
const updateDriverLicense = (id, data, userId) => updateRecord(DriverLicense, id, data, userId, {
  label: 'Driver licence',
  duplicateMessage: 'This driver already has a licence record with that number',
});
const deleteDriverLicense = (id) => deleteRecord(DriverLicense, id, 'Driver licence');

const listDriverDocuments = (query) => listRecords(DriverDocument, query, {
  dateField: 'expiryDate',
  searchFields: ['documentNumber', 'documentType'],
});
const createDriverDocument = (data, userId) => createRecord(DriverDocument, data, userId);
const updateDriverDocument = (id, data, userId) => updateRecord(DriverDocument, id, data, userId, {
  label: 'Driver document',
});
const deleteDriverDocument = (id) => deleteRecord(DriverDocument, id, 'Driver document');

const listDriverAttendance = (query) => listRecords(DriverAttendance, query, {
  statusField: 'status',
  dateField: 'attendanceDate',
  searchFields: ['remarks'],
});
const createDriverAttendance = (data, userId) => createRecord(DriverAttendance, data, userId, {
  dateField: 'attendanceDate',
  duplicateMessage: 'Attendance is already recorded for this driver and date',
});
async function updateDriverAttendance(id, data, userId) {
  validateObjectId(id, 'attendance record ID');
  const current = await DriverAttendance.findOne({ _id: id, isDeleted: false }).lean();
  if (!current) throw createError('Attendance record not found', 404);
  const next = { ...current, ...data };
  if (next.status === 'Present' && (!next.checkIn || !next.checkOut)) {
    throw createError('Check-in and check-out are required for present attendance.', 400);
  }
  if (next.checkIn && next.checkOut && next.checkOut <= next.checkIn) {
    throw createError('Check-out must be later than check-in.', 400);
  }
  return updateRecord(DriverAttendance, id, data, userId, {
    label: 'Attendance record',
    dateField: 'attendanceDate',
    duplicateMessage: 'Attendance is already recorded for this driver and date',
  });
}
const deleteDriverAttendance = (id) => deleteRecord(DriverAttendance, id, 'Attendance record');

const listDriverPayments = async (query) => {
  const result = await listRecords(DriverPayment, query, {
    statusField: 'status',
    dateField: 'periodStart',
  });
  return { ...result, data: result.data.map(addNetAmount) };
};
const createDriverPayment = (data, userId) => createRecord(DriverPayment, data, userId, {
  withNetAmount: true,
  duplicateMessage: 'A payment record already exists for this driver and pay period',
});
async function updateDriverPayment(id, data, userId) {
  validateObjectId(id, 'driver payment ID');
  const current = await DriverPayment.findOne({ _id: id, isDeleted: false }).lean();
  if (!current) throw createError('Driver payment not found', 404);
  if (current.status === 'Paid') throw createError('Paid driver payments cannot be edited', 409);

  const next = { ...current, ...data };
  if (next.periodEnd < next.periodStart) {
    throw createError('Pay period end must be on or after the start', 400);
  }
  if (next.deductions > next.baseAmount + next.allowances) {
    throw createError('Deductions cannot exceed gross pay', 400);
  }
  return updateRecord(DriverPayment, id, data, userId, {
    label: 'Driver payment',
    withNetAmount: true,
    duplicateMessage: 'A payment record already exists for this driver and pay period',
  });
}

async function deleteDriverPayment(id) {
  validateObjectId(id, 'driver payment ID');
  const payment = await DriverPayment.findOne({ _id: id, isDeleted: false }).select('status').lean();
  if (!payment) throw createError('Driver payment not found', 404);
  if (payment.status === 'Paid') throw createError('Paid driver payments cannot be deleted', 409);
  return deleteRecord(DriverPayment, id, 'Driver payment');
}

const updateDriverPaymentStatus = async (id, status, userId) => {
  validateObjectId(id, 'driver payment ID');
  const current = await DriverPayment.findOne({ _id: id, isDeleted: false }).select('status').lean();
  if (!current) throw createError('Driver payment not found', 404);
  const transitions = {
    Draft: ['Approved', 'OnHold'],
    Approved: ['Paid', 'OnHold'],
    OnHold: ['Draft', 'Approved'],
    Paid: [],
  };
  if (current.status !== status && !transitions[current.status]?.includes(status)) {
    throw createError(`Driver payment cannot move from ${current.status} to ${status}`, 409);
  }
  const payment = await updateRecord(DriverPayment, id, { status }, userId, { label: 'Driver payment' });
  return addNetAmount(payment);
};

async function getDriverPerformanceReport(query = {}) {
  const attendanceFilter = { isDeleted: false };
  if (query.startDate || query.endDate) {
    attendanceFilter.attendanceDate = {};
    if (query.startDate) {
      const startDate = new Date(query.startDate);
      if (Number.isNaN(startDate.getTime())) throw createError('Invalid startDate', 400);
      attendanceFilter.attendanceDate.$gte = startDate;
    }
    if (query.endDate) {
      const endDate = new Date(query.endDate);
      if (Number.isNaN(endDate.getTime())) throw createError('Invalid endDate', 400);
      endDate.setUTCHours(23, 59, 59, 999);
      attendanceFilter.attendanceDate.$lte = endDate;
    }
  }

  const [driverCount, activeDriverCount, attendance] = await Promise.all([
    Driver.countDocuments({ isDeleted: false }),
    Driver.countDocuments({ isDeleted: false, driverStatus: { $nin: ['Inactive', 'Suspended'] } }),
    DriverAttendance.aggregate([
      { $match: attendanceFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);
  const counts = Object.fromEntries(attendance.map(({ _id, count }) => [_id, count]));
  const attendanceDays = Object.values(counts).reduce((total, count) => total + count, 0);
  const presentDays = counts.Present || 0;
  const halfDays = counts.HalfDay || 0;
  return {
    metrics: {
      drivers: driverCount,
      activeDrivers: activeDriverCount,
      recordedAttendanceDays: attendanceDays,
      presentDays,
      halfDays,
      absentDays: counts.Absent || 0,
      leaveDays: counts.OnLeave || 0,
      attendanceRatePercent: attendanceDays
        ? Number((((presentDays + halfDays * 0.5) / attendanceDays) * 100).toFixed(2))
        : null,
    },
    scope: 'Attendance-based metrics only; trip performance requires trip records.',
  };
}

module.exports = {
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
  deleteDriverPayment,
  updateDriverPaymentStatus,
  getDriverPerformanceReport,
};
