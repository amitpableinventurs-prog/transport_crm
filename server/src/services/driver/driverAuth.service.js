
const mongoose = require('mongoose');
const { randomInt } = require('crypto');

const Driver = require('../../models/driver/driver.model');

// Common error handler
const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Validate MongoDB ObjectId
const validateObjectId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError('Invalid driver ID', 400);
  }
};

// Escape special regex characters
const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};


// Generate unique Driver Code
const generateDriverCode = async () => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const date = new Date();
    const datePart = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('');

    const randomPart = randomInt(100000, 1000000);

    const driverCode = `DRV-${datePart}-${randomPart}`;

    const existingDriver = await Driver.exists({ driverCode });

    if (!existingDriver) {
      return driverCode;
    }
  }

  throw createError('Unable to generate unique driver code', 500);
};

// Create Driver
const createDriver = async (data, userId = null) => {
  const phone = data.contactInfo?.phone;

  const existingDriver = await Driver.findOne({
    'contactInfo.phone': phone,
    isDeleted: false,
  });

  if (existingDriver) {
    throw createError('Driver with this phone number already exists', 409);
  }

  const driverCode = await generateDriverCode();

  let driver;
  try {
    driver = await Driver.create({
      ...data,
      driverCode,
      createdBy: userId && mongoose.isValidObjectId(userId)
        ? userId
        : null,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw createError('Driver with this phone number already exists', 409);
    }
    throw error;
  }

  return driver;
};

// Get All Drivers
const getAllDrivers = async (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(query.limit, 10) || 10)
  );

  const skip = (page - 1) * limit;

  const filter = {
    isDeleted: false,
  };

  if (query.driverStatus) {
    filter.driverStatus = query.driverStatus;
  }

  if (query.employmentType) {
    filter['employmentDetails.employmentType'] = query.employmentType;
  }

  if (query.search && query.search.trim()) {
    const search = escapeRegex(query.search.trim());

    filter.$or = [
      { driverCode: { $regex: search, $options: 'i' } },
      { 'personalInfo.fullName': { $regex: search, $options: 'i' } },
      { 'contactInfo.phone': { $regex: search, $options: 'i' } },
    ];
  }

  const [drivers, total] = await Promise.all([
    Driver.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Driver.countDocuments(filter),
  ]);

  return {
    data: drivers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get Driver By ID
const getDriverById = async (driverId) => {
  validateObjectId(driverId);

  const driver = await Driver.findOne({
    _id: driverId,
    isDeleted: false,
  }).lean();

  if (!driver) {
    throw createError('Driver not found', 404);
  }

  return driver;
};

// Update Driver
const updateDriver = async (driverId, data, userId = null) => {
  validateObjectId(driverId);

  const driver = await Driver.findOne({
    _id: driverId,
    isDeleted: false,
  });

  if (!driver) {
    throw createError('Driver not found', 404);
  }

  // These fields are managed separately
  if (data.driverCode || data.driverStatus) {
    throw createError(
      'Driver code and status cannot be updated through this endpoint',
      400
    );
  }

  const allowedFields = [
    'personalInfo',
    'contactInfo',
    'emergencyContact',
    'employmentDetails',
    'notes',
  ];

  const updateData = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      if (data[field] && typeof data[field] === 'object' && !Array.isArray(data[field])) {
        for (const [nestedField, value] of Object.entries(data[field])) {
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            for (const [leafField, leafValue] of Object.entries(value)) {
              updateData[`${field}.${nestedField}.${leafField}`] = leafValue;
            }
          } else {
            updateData[`${field}.${nestedField}`] = value;
          }
        }
      } else {
        updateData[field] = data[field];
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw createError('No valid fields provided for update', 400);
  }

  // Check phone number uniqueness if phone is being changed
  const newPhone = data.contactInfo?.phone;

  if (
    newPhone &&
    newPhone !== driver.contactInfo.phone
  ) {
    const existingDriver = await Driver.findOne({
      _id: { $ne: driverId },
      'contactInfo.phone': newPhone,
      isDeleted: false,
    });

    if (existingDriver) {
      throw createError(
        'Another driver already uses this phone number',
        409
      );
    }
  }

  updateData.updatedBy =
    userId && mongoose.isValidObjectId(userId)
      ? userId
      : null;

  const updatedDriver = await Driver.findByIdAndUpdate(
    driverId,
    { $set: updateData },
    {
      new: true,
      runValidators: true,
    }
  );

  return updatedDriver;
};

// Soft Delete Driver
const deleteDriver = async (driverId) => {
  validateObjectId(driverId);

  const driver = await Driver.findOne({
    _id: driverId,
    isDeleted: false,
  });

  if (!driver) {
    throw createError('Driver not found', 404);
  }

  if (['Assigned', 'OnTrip'].includes(driver.driverStatus)) {
    throw createError(
      'Driver cannot be deleted while assigned or on a trip',
      409
    );
  }

  driver.isDeleted = true;
  driver.driverStatus = 'Inactive';

  await driver.save();

  return true;
};

const updateDriverStatus = async (driverId, driverStatus, userId = null) => {
  validateObjectId(driverId);
  if (['Assigned', 'OnTrip'].includes(driverStatus)) {
    throw createError(
      'Driver assignment and trip statuses must be updated through trip management',
      409
    );
  }

  const driver = await Driver.findOne({
    _id: driverId,
    isDeleted: false,
  });
  if (!driver) throw createError('Driver not found', 404);
  if (['Assigned', 'OnTrip'].includes(driver.driverStatus)) {
    throw createError('Driver status cannot be changed while assigned or on a trip', 409);
  }

  driver.driverStatus = driverStatus;
  driver.updatedBy = userId && mongoose.isValidObjectId(userId) ? userId : null;
  await driver.save();
  return driver;
};

module.exports = {
  createDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  updateDriverStatus,
  deleteDriver,
};
