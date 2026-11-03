const { Customer } = require('../../models/customers/auth.model');
const { CustomerPortal } = require('../../models/customers/portal.model');
const { CustomerActivity } = require('../../models/customers/activity.model');
const kycDocumentService = require('./kyc-document.service');

const MAX_ADDRESSES = 10;

const getOrCreatePortal = async (customerId) => {
    return CustomerPortal.findOneAndUpdate(
        { customerId },
        { $setOnInsert: { customerId } },
        { new: true, upsert: true }
    );
};

const getCustomer = async (customerId) => {
    const customer = await Customer.findById(customerId);
    if (!customer) throw new Error('Customer not found.');
    return customer;
};

const isProfileFilled = (c) =>
    !!(c.companyName && c.contactPerson && c.email && c.pan &&
       c.address && c.address.street && c.address.city && c.address.state && c.address.pincode);

// ---------- Dashboard ----------
exports.getDashboardService = async (customerId) => {
    const [customer, portal] = await Promise.all([
        getCustomer(customerId),
        getOrCreatePortal(customerId)
    ]);

    const checks = [
        !!customer.companyName, !!customer.contactPerson, !!customer.email, !!customer.pan,
        !!(customer.address && customer.address.street && customer.address.city &&
           customer.address.state && customer.address.pincode)
    ];
    const completionPercent = Math.round((checks.filter(Boolean).length / checks.length) * 100);

    return {
        customer: {
            _id: customer._id,
            phone: customer.phone,
            companyName: customer.companyName,
            contactPerson: customer.contactPerson,
            status: customer.status
        },
        profile: { isProfileComplete: customer.isProfileComplete, completionPercent },
        savedAddresses: portal.addresses.length,
        preferences: portal.preferences,
        bookings: null // Booking module ke baad counts aayenge
    };
};

// ---------- Profile ----------
exports.getProfileService = async (customerId) => getCustomer(customerId);

exports.updateProfileService = async (customerId, data) => {
    const customer = await getCustomer(customerId);
    const { address, gstin, ...rest } = data;
    const previousKycIdentity = JSON.stringify({ pan: customer.pan, gstin: customer.gstin, address: customer.address.toObject() });
    const changedFields = [];
    let kycIdentityChanged = false;

    Object.keys(rest).forEach((key) => {
        if (String(customer[key] || '') !== String(rest[key] || '')) {
            changedFields.push(key);
            if (key === 'pan') kycIdentityChanged = true;
        }
        customer[key] = rest[key];
    });
    if (gstin !== undefined) {
        if (String(customer.gstin || '') !== String(gstin || '')) {
            changedFields.push('gstin');
            kycIdentityChanged = true;
        }
        customer.gstin = gstin || undefined;
    }
    if (address) {
        Object.keys(address).forEach((key) => {
            if (String(customer.address[key] || '') !== String(address[key] || '')) {
                changedFields.push(`address.${key}`);
                kycIdentityChanged = true;
            }
            customer.address[key] = address[key];
        });
    }

    customer.isProfileComplete = isProfileFilled(customer);
    const currentKycIdentity = JSON.stringify({ pan: customer.pan, gstin: customer.gstin, address: customer.address.toObject() });
    if (kycIdentityChanged && previousKycIdentity !== currentKycIdentity) customer.markKycNotSubmitted();
    await customer.save();
    if (changedFields.length) {
        await CustomerActivity.create({
            customerId,
            type: 'profile_updated',
            subject: 'Customer profile updated',
            description: `Updated fields: ${changedFields.join(', ')}`,
            actorId: String(customerId),
            actorRole: 'customer'
        });
    }
    return customer;
};

exports.submitKycService = async (customerId) => {
    const customer = await getCustomer(customerId);
    if (!customer.isProfileComplete || !customer.pan || !customer.address?.street || !customer.address?.city || !customer.address?.state || !customer.address?.pincode) {
        throw Object.assign(new Error('Complete your profile before submitting KYC.'), { statusCode: 409 });
    }
    await kycDocumentService.validateRequiredKycDocuments(customer);
    if (customer.kycStatus === 'Pending') {
        return customer;
    }

    customer.markKycPending();
    await customer.save();
    await CustomerActivity.create({
        customerId,
        type: 'kyc_submitted',
        subject: 'KYC submitted for review',
        actorId: String(customerId),
        actorRole: 'customer'
    });
    return customer;
};

// ---------- Preferences ----------
exports.getPreferencesService = async (customerId) => {
    const portal = await getOrCreatePortal(customerId);
    return portal.preferences;
};

exports.updatePreferencesService = async (customerId, data) => {
    const portal = await getOrCreatePortal(customerId);
    Object.keys(data).forEach((key) => { portal.preferences[key] = data[key]; });
    await portal.save();
    return portal.preferences;
};

// ---------- Addresses ----------
exports.listAddressesService = async (customerId) => {
    const portal = await getOrCreatePortal(customerId);
    return portal.addresses;
};

exports.addAddressService = async (customerId, data) => {
    const portal = await getOrCreatePortal(customerId);
    if (portal.addresses.length >= MAX_ADDRESSES) {
        throw new Error(`Maximum ${MAX_ADDRESSES} saved addresses allowed.`);
    }

    if (data.isDefault || portal.addresses.length === 0) {
        portal.addresses.forEach((a) => { a.isDefault = false; });
        data.isDefault = true;
    }

    portal.addresses.push(data);
    await portal.save();
    return portal.addresses[portal.addresses.length - 1];
};

exports.updateAddressService = async (customerId, addressId, data) => {
    const portal = await getOrCreatePortal(customerId);
    const address = portal.addresses.id(addressId);
    if (!address) throw new Error('Address not found.');

    if (data.isDefault) {
        portal.addresses.forEach((a) => { a.isDefault = false; });
    }
    address.set(data);
    await portal.save();
    return address;
};

exports.deleteAddressService = async (customerId, addressId) => {
    const portal = await getOrCreatePortal(customerId);
    const address = portal.addresses.id(addressId);
    if (!address) throw new Error('Address not found.');

    const wasDefault = address.isDefault;
    portal.addresses.pull(addressId);
    if (wasDefault && portal.addresses.length > 0) {
        portal.addresses[0].isDefault = true;
    }
    await portal.save();
    return { message: 'Address deleted.' };
};