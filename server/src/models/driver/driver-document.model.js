const mongoose = require('mongoose');

const driverDocumentSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ['DrivingLicence', 'IdentityProof', 'AddressProof', 'MedicalCertificate', 'Other'],
      required: true,
    },
    documentNumber: { type: String, trim: true, default: '' },
    issueDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null },
    fileUrl: { type: String, trim: true, default: '' },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true, versionKey: false }
);

driverDocumentSchema.index({ driverId: 1, documentType: 1, isDeleted: 1 });
driverDocumentSchema.index({ expiryDate: 1, isDeleted: 1 });

module.exports = mongoose.model('DriverDocument', driverDocumentSchema);
