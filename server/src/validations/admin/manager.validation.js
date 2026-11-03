const Joi = require('joi');
const { mobilePhone } = require('../auth/auth.validation');

const status = Joi.string().valid('Active', 'Inactive');
const editable = {
    fullName: Joi.string().trim().min(2).max(100),
    phone: mobilePhone.optional(),
    email: Joi.string().trim().email().allow(''),
    branch: Joi.string().trim().max(100).allow(''),
    status
};

exports.createManagerSchema = Joi.object({
    ...editable,
    fullName: editable.fullName.required(),
    phone: mobilePhone
}).unknown(false);

// The generic workspace form sends every field back, including read-only ones; strip those.
exports.updateManagerSchema = Joi.object(editable).min(1).options({ stripUnknown: true });

exports.updateManagerStatusSchema = Joi.object({ status: status.required() }).unknown(false);

exports.managerListQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().trim().max(120).allow(''),
    status
}).unknown(false);
