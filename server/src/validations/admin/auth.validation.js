const Joi = require('joi');

exports.validateAdminOtpRequest = (data) => Joi.object({}).unknown(false).validate(data || {});

exports.validateAdminOtpVerification = (data) => Joi.object({
    otp: Joi.string().pattern(/^\d{6}$/).required()
}).validate(data);