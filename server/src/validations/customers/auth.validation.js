const Joi = require('joi');

const validateSendOtp = (data) => {
    const schema = Joi.object({
        phone: Joi.string().required().trim().messages({
            'string.empty': 'Phone number is required.',
            'any.required': 'Phone number is required.'
        })
    });
    return schema.validate(data);
};

const validateVerifyOtp = (data) => {
    const schema = Joi.object({
        phone: Joi.string().required().trim().messages({
            'string.empty': 'Phone number is required.',
            'any.required': 'Phone number is required.'
        }),
        otp: Joi.string().required().trim().messages({
            'string.empty': 'OTP is required.',
            'any.required': 'OTP is required.'
        })
    });
    return schema.validate(data);
};

const validateRefreshToken = (data) => {
    const schema = Joi.object({
        refreshToken: Joi.string().required().messages({
            'string.empty': 'Refresh Token is required.',
            'any.required': 'Refresh Token is required.'
        })
    });
    return schema.validate(data);
};

const validateCompleteProfile = (data) => {
    const schema = Joi.object({
        companyName: Joi.string().required().trim().messages({
            'string.empty': 'Company name is required.'
        }),
        contactPerson: Joi.string().required().trim().messages({
            'string.empty': 'Contact person name is required.'
        }),
        email: Joi.string().email().required().trim().messages({
            'string.email': 'Invalid email format.',
            'string.empty': 'Email is required.'
        }),
        gstin: Joi.string().optional().allow('', null).uppercase().trim(),
        pan: Joi.string().required().uppercase().trim().messages({
            'string.empty': 'PAN number is required.'
        }),
        address: Joi.object({
            street: Joi.string().required().trim().messages({ 'string.empty': 'Street is required.' }),
            city: Joi.string().required().trim().messages({ 'string.empty': 'City is required.' }),
            state: Joi.string().required().trim().messages({ 'string.empty': 'State is required.' }),
            pincode: Joi.string().required().trim().messages({ 'string.empty': 'Pincode is required.' })
        }).required().messages({ 'any.required': 'Address object is required.' })
    });
    return schema.validate(data);
};

const validateCustomerListQuery = (data) => Joi.object({
    search: Joi.string().trim().max(100).allow(''),
    status: Joi.string().valid('Pending', 'Active', 'Suspended'),
    kycStatus: Joi.string().valid('NotSubmitted', 'Pending', 'Verified', 'Rejected'),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100)
}).unknown(false).validate(data, { convert: true });

const validateCustomerStatusUpdate = (data) => Joi.object({
    status: Joi.string().valid('Pending', 'Active', 'Suspended').required(),
    remarks: Joi.string().trim().max(500).allow('')
}).unknown(false).validate(data);

const validateCustomerProfileUpdate = (data) => Joi.object({
    companyName: Joi.string().trim().min(2).max(200),
    contactPerson: Joi.string().trim().min(2).max(120),
    customerType: Joi.string().valid('individual', 'business'),
    businessType: Joi.string().trim().max(120).allow(''),
    email: Joi.string().email().trim().allow('', null),
    gstin: Joi.string().uppercase().trim().allow('', null),
    pan: Joi.string().uppercase().trim().allow('', null),
    notes: Joi.string().trim().max(2000).allow(''),
    phone: Joi.string().trim().pattern(/^[6-9]\d{9}$/),
    address: Joi.object({
        street: Joi.string().trim().max(300),
        city: Joi.string().trim().max(100),
        state: Joi.string().trim().max(100),
        pincode: Joi.string().trim().pattern(/^\d{6}$/)
    }).min(1).unknown(false)
}).min(1).unknown(false).validate(data);

const validateCustomerKycReview = (data) => Joi.object({
    status: Joi.string().valid('Verified', 'Rejected').required(),
    remarks: Joi.string().trim().max(500).allow('')
}).unknown(false).validate(data);

const validateCustomerActivityQuery = (data) => Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    type: Joi.string().valid(
        'note', 'call', 'email', 'sms', 'follow_up', 'profile_updated',
        'status_changed', 'kyc_reviewed', 'kyc_submitted',
        'kyc_document_uploaded', 'kyc_document_reviewed'
    )
}).unknown(false).validate(data, { convert: true });

const validateCustomerActivityCreate = (data) => Joi.object({
    type: Joi.string().valid('note', 'call', 'email', 'sms', 'follow_up').required(),
    subject: Joi.string().trim().min(1).max(120).required(),
    description: Joi.string().trim().max(2000).allow(''),
    followUpAt: Joi.date().iso().when('type', {
        is: 'follow_up',
        then: Joi.required(),
        otherwise: Joi.forbidden()
    })
}).unknown(false).validate(data);

const validateCustomerRegistration = (data) => Joi.object({
    customerType: Joi.string().valid('Company', 'Individual').required(),
    company: Joi.string().trim().min(2).max(200).required(),
    contactPerson: Joi.string().trim().min(2).max(120).required(),
    phone: Joi.string().trim().pattern(/^[6-9]\d{9}$/).required(),
    alternatePhone: Joi.string().trim().allow('').pattern(/^[6-9]\d{9}$/).default(''),
    email: Joi.string().email().trim().allow('').default(''),
    gstin: Joi.string().uppercase().trim().allow('').pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/).default(''),
    pan: Joi.string().uppercase().trim().allow('').pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/).default(''),
    industry: Joi.string().trim().max(120).allow('').default(''),
    billingAddress: Joi.string().trim().min(3).max(500).required(),
    billingCity: Joi.string().trim().min(2).max(100).required(),
    billingState: Joi.string().trim().min(2).max(100).required(),
    billingPincode: Joi.string().trim().pattern(/^\d{6}$/).required(),
    pickupAddress: Joi.string().trim().max(500).allow('').default(''),
    pickupCity: Joi.string().trim().max(100).allow('').default(''),
    pickupState: Joi.string().trim().max(100).allow('').default(''),
    pickupPincode: Joi.string().trim().allow('').pattern(/^\d{6}$/).default(''),
    paymentTerms: Joi.string().valid('Advance', 'COD', '7 Days', '15 Days', '30 Days', '45 Days', '60 Days').required(),
    creditLimit: Joi.number().min(0).required(),
    status: Joi.string().valid('Active', 'Inactive', 'Blocked').required(),
    verificationStatus: Joi.string().valid('Pending', 'Verified', 'Rejected').required(),
    notes: Joi.string().trim().max(2000).allow('').default('')
}).unknown(false).validate(data);

const validateKycSubmission = (data) => Joi.object({})
    .unknown(false)
    .validate(data || {});

module.exports = {
    validateSendOtp,
    validateVerifyOtp,
    validateRefreshToken,
    validateCompleteProfile,
    validateCustomerListQuery,
    validateCustomerStatusUpdate,
    validateCustomerProfileUpdate,
    validateCustomerKycReview,
    validateCustomerActivityQuery,
    validateCustomerActivityCreate,
    validateCustomerRegistration,
    validateKycSubmission
};