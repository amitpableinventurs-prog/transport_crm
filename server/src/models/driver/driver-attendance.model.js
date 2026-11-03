const mongoose = require('mongoose');

const driverAttendanceSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
    },
    attendanceDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'OnLeave', 'HalfDay'],
      required: true,
    },
    checkIn: { type: String, default: '' },
    checkOut: { type: String, default: '' },
    remarks: { type: String, trim: true, maxlength: 500, default: '' },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true, versionKey: false }
);

driverAttendanceSchema.index(
  { driverId: 1, attendanceDate: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
driverAttendanceSchema.index({ attendanceDate: -1, status: 1 });

module.exports = mongoose.model('DriverAttendance', driverAttendanceSchema);
