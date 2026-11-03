const { Customer } = require('../../models/customers/auth.model');

const serviceError = (message, statusCode) => Object.assign(new Error(message), { statusCode });

// 4. Complete Profile Service (Updated for exact schema fields)
exports.completeProfileService = async (customerId, profileData) => {
    const { companyName, contactPerson, email, gstin, pan, address } = profileData;

    const customer = await Customer.findById(customerId);
    if (!customer) {
        throw new Error('Customer not found.');
    }

    const previousKycIdentity = JSON.stringify({ pan: customer.pan, gstin: customer.gstin, address: customer.address?.toObject?.() || customer.address });

    customer.companyName = companyName.trim();
    customer.contactPerson = contactPerson.trim();
    customer.email = email.trim().toLowerCase();
    if (gstin) customer.gstin = gstin.trim().toUpperCase();
    customer.pan = pan.trim().toUpperCase();

    // Nested address assignment matching the schema
    customer.address = {
        street: address.street.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        pincode: address.pincode.trim()
    };

    customer.isProfileComplete = true;
    const currentKycIdentity = JSON.stringify({ pan: customer.pan, gstin: customer.gstin, address: customer.address.toObject() });
    if (previousKycIdentity !== currentKycIdentity) customer.markKycNotSubmitted();

    await customer.save();
    return customer;
};

// 5. Get Profile Service
exports.getProfileService = async (customerId) => {
    const customer = await Customer.findById(customerId);
    if (!customer) {
        throw new Error('Customer not found.');
    }
    return customer;
};
