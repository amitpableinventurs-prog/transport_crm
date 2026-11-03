const mongoose = require('mongoose');

const driverLicenseSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
      index: true,
    },
    licenseNumber: { type: String, required: true, trim: true, uppercase: true },
    licenseType: {
      type: String,
      enum: ['LMV', 'HMV', 'Transport', 'Other'],
      required: true,
    },
    issueDate: { type: Date, default: null },
    expiryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Valid', 'ExpiringSoon', 'Expired', 'UnderReview'],
      default: 'UnderReview',
    },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true, versionKey: false }
);

driverLicenseSchema.index(
  { driverId: 1, licenseNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
driverLicenseSchema.index({ expiryDate: 1, isDeleted: 1 });

module.exports = mongoose.model('DriverLicense', driverLicenseSchema);
