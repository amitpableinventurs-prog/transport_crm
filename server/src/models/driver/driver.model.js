
const mongoose = require('mongoose');
const { Schema } = mongoose;

const driverSchema = new Schema(
  {
    driverCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      immutable: true,
    },

    personalInfo: {
      fullName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      dateOfBirth: {
        type: Date,
        default: null,
      },

      gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        default: null,
      },
    },

    contactInfo: {
      phone: {
        type: String,
        required: true,
        trim: true,
      },

      alternatePhone: {
        type: String,
        trim: true,
        default: '',
      },

      email: {
        type: String,
        lowercase: true,
        trim: true,
        default: '',
      },

      address: {
        street: { type: String, trim: true, default: '' },
        city: { type: String, trim: true, default: '' },
        state: { type: String, trim: true, default: '' },
        postalCode: { type: String, trim: true, default: '' },
        country: { type: String, trim: true, default: 'India' },
      },
    },

    emergencyContact: {
      name: { type: String, trim: true, default: '' },
      relationship: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
    },

    employmentDetails: {
      joiningDate: {
        type: Date,
        required: true,
      },

      employmentType: {
        type: String,
        enum: ['FullTime', 'Contract', 'Attached'],
        default: 'FullTime',
      },

      experienceYears: {
        type: Number,
        min: 0,
        max: 60,
        default: 0,
      },
    },

    driverStatus: {
      type: String,
      enum: [
        'Available',
        'Assigned',
        'OnTrip',
        'OnLeave',
        'Inactive',
        'Suspended',
      ],
      default: 'Available',
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      default: null,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
driverSchema.index({ driverStatus: 1, isDeleted: 1 });
driverSchema.index({ 'personalInfo.fullName': 1 });
driverSchema.index({ 'contactInfo.phone': 1 });
driverSchema.index({ createdAt: -1 });

const Driver = mongoose.model('Driver', driverSchema);

module.exports = Driver;
