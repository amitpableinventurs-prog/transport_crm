const mongoose = require('mongoose');

const driverPaymentSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
      index: true,
    },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    baseAmount: { type: Number, min: 0, required: true },
    allowances: { type: Number, min: 0, default: 0 },
    deductions: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ['Draft', 'Approved', 'Paid', 'OnHold'],
      default: 'Draft',
    },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true, versionKey: false }
);

driverPaymentSchema.index(
  { driverId: 1, periodStart: 1, periodEnd: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
driverPaymentSchema.index({ status: 1, periodStart: -1, isDeleted: 1 });

module.exports = mongoose.model('DriverPayment', driverPaymentSchema);
