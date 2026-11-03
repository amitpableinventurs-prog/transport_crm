const { Customer } = require('../../models/customers/auth.model');
const { CustomerActivity } = require('../../models/customers/activity.model');
const kycDocumentService = require('./kyc-document.service');

const VALID_STATUSES = ['Pending', 'Active', 'Suspended'];
const VALID_KYC_STATUSES = ['NotSubmitted', 'Pending', 'Verified', 'Rejected'];

const safeNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const writeActivity = (customerId, type, subject, description, actor) => CustomerActivity.create({
    customerId,
    type,
    subject,
    description,
    actorId: String(actor.id),
    actorRole: actor.role
});

const findRegistrationConflict = async (data, customerId) => {
    const conditions = [{ phone: String(data.phone).trim() }];
    if (data.gstin) conditions.push({ gstin: data.gstin.trim().toUpperCase() });
    const existing = await Customer.findOne({
        $or: conditions,
        ...(customerId ? { _id: { $ne: customerId } } : {})
    }).select('phone gstin');

    if (existing) {
        const duplicateField = existing.phone === String(data.phone).trim() ? 'phone number' : 'GSTIN';
        throw Object.assign(new Error(`Another customer already uses this ${duplicateField}.`), { statusCode: 409 });
    }
};

const applyRegistrationData = (customer, data) => {
    const oldIdentity = JSON.stringify({
        pan: customer.pan,
        gstin: customer.gstin,
        address: customer.address?.toObject?.() || customer.address
    });

    customer.phone = data.phone.trim();
    customer.alternatePhone = data.alternatePhone.trim();
    customer.companyName = data.company.trim();
    customer.contactPerson = data.contactPerson.trim();
    customer.customerType = data.customerType === 'Individual' ? 'individual' : 'business';
    customer.businessType = data.industry.trim();
    customer.industry = data.industry.trim();
    customer.email = data.email.trim().toLowerCase() || undefined;
    customer.gstin = data.gstin.trim().toUpperCase() || undefined;
    customer.pan = data.pan.trim().toUpperCase();
    customer.address = {
        street: data.billingAddress.trim(),
        city: data.billingCity.trim(),
        state: data.billingState.trim(),
        pincode: data.billingPincode.trim()
    };
    customer.pickupAddress = {
        street: data.pickupAddress.trim(),
        city: data.pickupCity.trim(),
        state: data.pickupState.trim(),
        pincode: data.pickupPincode.trim()
    };
    customer.paymentTerms = data.paymentTerms;
    customer.creditLimit = data.creditLimit;
    customer.crmStatus = data.status;
    customer.crmVerificationStatus = data.verificationStatus;
    customer.notes = data.notes.trim();
    customer.isProfileComplete = true;
    customer.status = data.status === 'Blocked' ? 'Suspended' : data.status === 'Inactive' ? 'Pending' : 'Active';

    const newIdentity = JSON.stringify({
        pan: customer.pan,
        gstin: customer.gstin,
        address: customer.address.toObject?.() || customer.address
    });
    if (oldIdentity !== newIdentity) customer.markKycNotSubmitted();
};

const createCustomerRegistrationService = async (data) => {
    await findRegistrationConflict(data);
    const customer = new Customer();
    applyRegistrationData(customer, data);
    try {
        await customer.save();
    } catch (error) {
        if (error.code === 11000) {
            throw Object.assign(new Error('A customer with this phone number or GSTIN already exists.'), { statusCode: 409 });
        }
        throw error;
    }
    return customer;
};

const updateCustomerRegistrationService = async (customerId, data) => {
    const customer = await Customer.findById(customerId);
    if (!customer) throw Object.assign(new Error('Customer not found.'), { statusCode: 404 });

    await findRegistrationConflict(data, customerId);
    applyRegistrationData(customer, data);
    try {
        await customer.save();
    } catch (error) {
        if (error.code === 11000) {
            throw Object.assign(new Error('A customer with this phone number or GSTIN already exists.'), { statusCode: 409 });
        }
        throw error;
    }
    return customer;
};

const getCustomerManagementSummaryService = async () => {
    const [total, pending, active, suspended, kycPending, kycVerified, kycRejected] = await Promise.all([
        Customer.countDocuments(),
        Customer.countDocuments({ status: 'Pending' }),
        Customer.countDocuments({ status: 'Active' }),
        Customer.countDocuments({ status: 'Suspended' }),
        Customer.countDocuments({ kycStatus: 'Pending' }),
        Customer.countDocuments({ kycStatus: 'Verified' }),
        Customer.countDocuments({ kycStatus: 'Rejected' })
    ]);

    return {
        total,
        pending,
        active,
        suspended,
        profileComplete: await Customer.countDocuments({ isProfileComplete: true }),
        kycPending,
        kycVerified,
        kycRejected
    };
};

const listCustomersService = async (query = {}) => {
    const filters = {};
    const search = String(query.search || '').trim();
    const status = query.status;
    const page = safeNumber(query.page, 1);
    const limit = Math.min(safeNumber(query.limit, 20), 100);

    if (status && VALID_STATUSES.includes(status)) {
        filters.status = status;
    }
    if (query.kycStatus && VALID_KYC_STATUSES.includes(query.kycStatus)) {
        filters.kycStatus = query.kycStatus;
    }

    if (search) {
        filters.$or = [
            { phone: { $regex: search, $options: 'i' } },
            { companyName: { $regex: search, $options: 'i' } },
            { contactPerson: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
        Customer.find(filters)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Customer.countDocuments(filters)
    ]);

    return {
        customers,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1
        }
    };
};

const getCustomerByIdService = async (customerId) => {
    const customer = await Customer.findById(customerId);
    if (!customer) {
        throw Object.assign(new Error('Customer not found.'), { statusCode: 404 });
    }

    return customer;
};

const updateCustomerStatusService = async (customerId, status, remarks = '', actor) => {
    if (!VALID_STATUSES.includes(status)) {
        throw Object.assign(new Error('Invalid customer status.'), { statusCode: 400 });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
        throw Object.assign(new Error('Customer not found.'), { statusCode: 404 });
    }

    customer.status = status;
    customer.statusReason = remarks.trim();

    await customer.save();
    await writeActivity(customerId, 'status_changed', `Customer status changed to ${status}`, remarks.trim(), actor);
    return customer;
};

const reviewCustomerKycService = async (customerId, status, remarks = '', actor) => {
    if (!['Verified', 'Rejected'].includes(status)) {
        throw Object.assign(new Error('Invalid KYC review status.'), { statusCode: 400 });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
        throw Object.assign(new Error('Customer not found.'), { statusCode: 404 });
    }
    if (!customer.isProfileComplete || customer.kycStatus !== 'Pending') {
        throw Object.assign(new Error('Customer must submit KYC before it can be reviewed.'), { statusCode: 409 });
    }
    if (status === 'Verified') await kycDocumentService.validateVerifiedKycDocuments(customer);

    customer.kycStatus = status;
    customer.kycReviewedAt = new Date();
    customer.kycReviewedBy = String(actor.id);
    customer.kycRemarks = remarks.trim();
    await customer.save();
    await writeActivity(customerId, 'kyc_reviewed', `KYC ${status.toLowerCase()}`, remarks.trim(), actor);
    return customer;
};

const updateCustomerProfileService = async (customerId, data, actor) => {
    const customer = await Customer.findById(customerId);
    if (!customer) {
        throw Object.assign(new Error('Customer not found.'), { statusCode: 404 });
    }

    const updatable = [
        'companyName',
        'contactPerson',
        'customerType',
        'businessType',
        'email',
        'gstin',
        'pan',
        'notes',
        'phone'
    ];
    const changedFields = [];
    let kycIdentityChanged = false;

    updatable.forEach((key) => {
        if (data[key] !== undefined) {
            if (String(customer[key] || '') !== String(data[key] || '')) {
                changedFields.push(key);
                if (['gstin', 'pan'].includes(key)) kycIdentityChanged = true;
            }
            if (key === 'phone') {
                customer.phone = String(data.phone).trim();
                return;
            }
            customer[key] = data[key];
        }
    });

    if (data.address) {
        Object.entries(data.address).forEach(([key, value]) => {
            if (String(customer.address[key] || '') !== String(value || '')) {
                changedFields.push(`address.${key}`);
                kycIdentityChanged = true;
            }
            customer.address[key] = value;
        });
    }

    if (kycIdentityChanged) customer.markKycNotSubmitted();

    if (data.phone) {
        const existing = await Customer.findOne({ phone: String(data.phone).trim(), _id: { $ne: customerId } });
        if (existing) {
            throw Object.assign(new Error('Another customer already uses this phone number.'), { statusCode: 409 });
        }
    }

    await customer.save();
    if (changedFields.length) {
        await writeActivity(customerId, 'profile_updated', 'Customer profile updated', `Updated fields: ${changedFields.join(', ')}`, actor);
    }
    return customer;
};

const listCustomerActivitiesService = async (customerId, query = {}) => {
    const customer = await Customer.exists({ _id: customerId });
    if (!customer) throw Object.assign(new Error('Customer not found.'), { statusCode: 404 });

    const page = safeNumber(query.page, 1);
    const limit = Math.min(safeNumber(query.limit, 20), 100);
    const filters = { customerId };
    if (query.type) filters.type = query.type;
    const [activities, total] = await Promise.all([
        CustomerActivity.find(filters).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        CustomerActivity.countDocuments(filters)
    ]);

    return { activities, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

const createCustomerActivityService = async (customerId, data, actor) => {
    const customer = await Customer.exists({ _id: customerId });
    if (!customer) throw Object.assign(new Error('Customer not found.'), { statusCode: 404 });
    if (data.type === 'follow_up' && new Date(data.followUpAt) <= new Date()) {
        throw Object.assign(new Error('Follow-up time must be in the future.'), { statusCode: 400 });
    }

    return CustomerActivity.create({
        customerId,
        ...data,
        actorId: String(actor.id),
        actorRole: actor.role
    });
};

const completeCustomerFollowUpService = async (customerId, activityId) => {
    const activity = await CustomerActivity.findOne({ _id: activityId, customerId, type: 'follow_up' });
    if (!activity) throw Object.assign(new Error('Follow-up not found.'), { statusCode: 404 });
    if (!activity.followUpCompletedAt) {
        activity.followUpCompletedAt = new Date();
        await activity.save();
    }
    return activity;
};

module.exports = {
    getCustomerManagementSummaryService,
    listCustomersService,
    getCustomerByIdService,
    createCustomerRegistrationService,
    updateCustomerRegistrationService,
    updateCustomerStatusService,
    updateCustomerProfileService,
    reviewCustomerKycService,
    listCustomerActivitiesService,
    createCustomerActivityService,
    completeCustomerFollowUpService
};
