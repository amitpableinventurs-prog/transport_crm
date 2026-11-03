
const Joi = require('joi');

const phone = Joi.string().trim().pattern(/^[6-9]\d{9}$/);
const personalInfoSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required(),
  dateOfBirth: Joi.date().iso().max('now').empty('').allow(null).default(null),
  gender: Joi.string().valid('Male', 'Female', 'Other').empty('').allow(null).default(null),
}).unknown(false);
const contactInfoSchema = Joi.object({
  phone: phone.required(),
  alternatePhone: phone.allow(''),
  email: Joi.string().trim().email().lowercase().allow(''),
  address: Joi.object({
    street: Joi.string().trim().max(200).allow(''),
    city: Joi.string().trim().max(100).allow(''),
    state: Joi.string().trim().max(100).allow(''),
    postalCode: Joi.string().trim().pattern(/^\d{6}$/).allow(''),
    country: Joi.string().trim().max(100).allow('').default('India'),
  }).unknown(false),
}).unknown(false);
const emergencyContactSchema = Joi.object({
  name: Joi.string().trim().max(100).allow(''),
  relationship: Joi.string().trim().max(50).allow(''),
  phone: phone.allow(''),
}).unknown(false);
const employmentDetailsSchema = Joi.object({
  joiningDate: Joi.date().iso().max('now').required(),
  employmentType: Joi.string().valid('FullTime', 'Contract', 'Attached').default('FullTime'),
  experienceYears: Joi.number().empty('').min(0).max(60).default(0),
}).unknown(false);
const updatePersonalInfoSchema = personalInfoSchema.fork(['fullName'], (schema) => schema.optional());
const updateContactInfoSchema = contactInfoSchema.fork(['phone'], (schema) => schema.optional());
const updateEmploymentDetailsSchema = employmentDetailsSchema.fork(['joiningDate'], (schema) => schema.optional());

const createDriverSchema = Joi.object({
  personalInfo: personalInfoSchema.required(),
  contactInfo: contactInfoSchema.required(),
  emergencyContact: emergencyContactSchema,
  employmentDetails: employmentDetailsSchema.required(),
  driverStatus: Joi.string().valid('Available', 'OnLeave', 'Inactive', 'Suspended').default('Available'),
  notes: Joi.string().trim().max(1000).allow(''),
}).unknown(false);

const updateDriverSchema = Joi.object({
  personalInfo: updatePersonalInfoSchema,
  contactInfo: updateContactInfoSchema,
  emergencyContact: emergencyContactSchema,
  employmentDetails: updateEmploymentDetailsSchema,
  notes: Joi.string().trim().max(1000).allow(''),
}).min(1).unknown(false);

const updateDriverStatusSchema = Joi.object({
  driverStatus: Joi.string().valid('Available', 'Assigned', 'OnTrip', 'OnLeave', 'Inactive', 'Suspended').required(),
}).unknown(false);

const driverLicenseSchema = Joi.object({
  driverId: Joi.string().hex().length(24).required(),
  licenseNumber: Joi.string().trim().uppercase().min(5).max(50).required(),
  licenseType: Joi.string().valid('LMV', 'HMV', 'Transport', 'Other').required(),
  issueDate: Joi.date().iso().max('now').empty('').allow(null).default(null),
  expiryDate: Joi.date().iso().required(),
  status: Joi.string().valid('Valid', 'ExpiringSoon', 'Expired', 'UnderReview').empty('').default('UnderReview'),
}).custom((license, helpers) => {
  if (license.issueDate && license.expiryDate < license.issueDate) {
    return helpers.error('any.invalid');
  }
  return license;
}, 'licence date validation').messages({
  'any.invalid': 'Licence expiry date cannot be before its issue date',
});

const driverDocumentSchema = Joi.object({
  driverId: Joi.string().hex().length(24).required(),
  documentType: Joi.string().valid('DrivingLicence', 'IdentityProof', 'AddressProof', 'MedicalCertificate', 'Other').required(),
  documentNumber: Joi.string().trim().max(100).allow(''),
  issueDate: Joi.date().iso().empty('').allow(null).default(null),
  expiryDate: Joi.date().iso().empty('').allow(null).default(null),
  fileUrl: Joi.string().trim().max(1000).uri({ scheme: ['http', 'https'] }).allow(''),
}).custom((document, helpers) => {
  if (document.issueDate && document.expiryDate && document.expiryDate < document.issueDate) {
    return helpers.error('any.invalid');
  }
  return document;
}, 'document date validation').messages({
  'any.invalid': 'Document expiry date cannot be before its issue date',
});

const attendanceSchema = Joi.object({
  driverId: Joi.string().hex().length(24).required(),
  attendanceDate: Joi.date().iso().max('now').required(),
  status: Joi.string().valid('Present', 'Absent', 'OnLeave', 'HalfDay').required(),
  checkIn: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).allow(''),
  checkOut: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).allow(''),
  remarks: Joi.string().trim().max(500).allow(''),
}).custom((attendance, helpers) => {
  if (attendance.attendanceDate && attendance.status === 'Present' && (!attendance.checkIn || !attendance.checkOut)) {
    return helpers.error('any.custom', { message: 'Check-in and check-out are required for present attendance.' });
  }
  if (attendance.checkIn && attendance.checkOut && attendance.checkOut <= attendance.checkIn) {
    return helpers.error('any.custom', { message: 'Check-out must be later than check-in.' });
  }
  return attendance;
}, 'attendance time validation').messages({
  'any.custom': '{{#message}}',
});

const driverPaymentSchema = Joi.object({
  driverId: Joi.string().hex().length(24).required(),
  periodStart: Joi.date().iso().required(),
  periodEnd: Joi.date().iso().required(),
  baseAmount: Joi.number().min(0).required(),
  allowances: Joi.number().empty('').min(0).default(0),
  deductions: Joi.number().empty('').min(0).default(0),
  status: Joi.string().valid('Draft', 'Approved', 'Paid', 'OnHold').empty('').default('Draft'),
}).custom((payment, helpers) => {
  if (payment.periodEnd < payment.periodStart) {
    return helpers.error('any.invalid');
  }
  if (payment.baseAmount + (payment.allowances || 0) < (payment.deductions || 0)) {
    return helpers.error('any.invalid');
  }
  return payment;
}, 'pay-period and net-pay validation').messages({
  'any.invalid': 'Pay period end must be on or after the start, and deductions cannot exceed gross pay',
});

const updateDriverLicenseSchema = driverLicenseSchema.fork(
  ['driverId', 'licenseNumber', 'licenseType', 'expiryDate'],
  (schema) => schema.optional()
).min(1);
const updateDriverDocumentSchema = driverDocumentSchema.fork(
  ['driverId', 'documentType'],
  (schema) => schema.optional()
).min(1);
const updateAttendanceSchema = attendanceSchema.fork(
  ['driverId', 'attendanceDate', 'status'],
  (schema) => schema.optional()
).min(1);
const updateDriverPaymentSchema = driverPaymentSchema.fork(
  ['driverId', 'periodStart', 'periodEnd', 'baseAmount'],
  (schema) => schema.optional()
).min(1);

const updateDriverPaymentStatusSchema = Joi.object({
  status: Joi.string().valid('Draft', 'Approved', 'Paid', 'OnHold').required(),
}).unknown(false);

const queryBase = {
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  search: Joi.string().trim().max(120),
  driverId: Joi.string().hex().length(24),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
};

const driverListQuerySchema = Joi.object({
  ...queryBase,
  driverStatus: Joi.string().valid('Available', 'Assigned', 'OnTrip', 'OnLeave', 'Inactive', 'Suspended'),
  employmentType: Joi.string().valid('FullTime', 'Contract', 'Attached'),
}).unknown(false);
const licenseListQuerySchema = Joi.object({
  ...queryBase,
  status: Joi.string().valid('Valid', 'ExpiringSoon', 'Expired', 'UnderReview'),
}).unknown(false);
const documentListQuerySchema = Joi.object(queryBase).unknown(false);
const attendanceListQuerySchema = Joi.object({
  ...queryBase,
  status: Joi.string().valid('Present', 'Absent', 'OnLeave', 'HalfDay'),
}).unknown(false);
const paymentListQuerySchema = Joi.object({
  ...queryBase,
  status: Joi.string().valid('Draft', 'Approved', 'Paid', 'OnHold'),
}).unknown(false);
const updateLicenseStatusSchema = Joi.object({
  status: Joi.string().valid('Valid', 'ExpiringSoon', 'Expired', 'UnderReview').required(),
}).unknown(false);
const updateAttendanceStatusSchema = Joi.object({
  status: Joi.string().valid('Present', 'Absent', 'OnLeave', 'HalfDay').required(),
}).unknown(false);
const performanceQuerySchema = Joi.object(queryBase).unknown(false);

module.exports = {
  createDriverSchema,
  updateDriverSchema,
  updateDriverStatusSchema,
  driverLicenseSchema,
  driverDocumentSchema,
  attendanceSchema,
  driverPaymentSchema,
  updateDriverLicenseSchema,
  updateDriverDocumentSchema,
  updateAttendanceSchema,
  updateDriverPaymentSchema,
  updateDriverPaymentStatusSchema,
  driverListQuerySchema,
  licenseListQuerySchema,
  documentListQuerySchema,
  attendanceListQuerySchema,
  paymentListQuerySchema,
  updateLicenseStatusSchema,
  updateAttendanceStatusSchema,
  performanceQuerySchema,
};
