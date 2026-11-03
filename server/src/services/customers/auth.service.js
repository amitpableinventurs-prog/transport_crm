const bcrypt = require('bcrypt');
const { randomInt } = require('crypto');
const { Customer } = require('../../models/customers/auth.model');
const { generateTokens, verifyRefreshToken } = require('../../utils/jwt.util');
const { sendSms } = require('../../utils/twillo');

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_LOCKOUT_MS = 15 * 60 * 1000;

const serviceError = (message, statusCode) => Object.assign(new Error(message), { statusCode });

// 1. Send OTP Service
exports.sendOtpService = async (phone) => {
    const trimmedPhone = phone.trim();
    const now = new Date();

    let customer = await Customer.findOne({ phone: trimmedPhone });
    if (!customer) {
        customer = new Customer({ phone: trimmedPhone });
    }

    customer = await Customer.findById(customer._id).select('+otp.codeHash +otp.expiresAt +otp.lockedUntil +otp.lastSentAt') || customer;
    if (customer.otp?.lockedUntil > now) {
        throw serviceError('Too many incorrect OTP attempts. Try again later.', 429);
    }
    if (customer.otp?.lastSentAt && now - customer.otp.lastSentAt < OTP_RESEND_MS) {
        throw serviceError('Please wait before requesting another OTP.', 429);
    }

    const generatedOtp = String(randomInt(100000, 1000000));
    customer.otp = {
        codeHash: await bcrypt.hash(generatedOtp, 10),
        expiresAt: new Date(now.getTime() + OTP_TTL_MS),
        attempts: 0,
        lockedUntil: null,
        lastSentAt: now
    };
    await customer.save();

    const messageBody = `Your TMS Verification OTP is: ${generatedOtp}. Valid for 10 minutes.`;
    try {
        await sendSms(trimmedPhone, messageBody);
    } catch (error) {
        customer.otp = undefined;
        await customer.save();
        throw serviceError('Unable to deliver OTP. Please try again later.', 503);
    }

    return {
        message: 'OTP sent successfully.',
        phone: trimmedPhone,
        expiresIn: 600,
        resendAfter: 60,
        ...(process.env.NODE_ENV !== 'production' ? { mockOtp: generatedOtp } : {})
    };
};

// 2. Verify OTP Service
exports.verifyOtpService = async (phone, otpCode) => {
    const trimmedPhone = phone.trim();
    const customer = await Customer.findOne({ phone: trimmedPhone })
        .select('+otp.codeHash +otp.expiresAt +otp.attempts +otp.lockedUntil');

    if (!customer || !customer.otp?.codeHash) {
        throw serviceError('OTP is invalid or expired.', 401);
    }

    const now = new Date();
    if (customer.otp.lockedUntil > now) {
        throw serviceError('Too many incorrect OTP attempts. Try again later.', 429);
    }

    if (customer.otp.expiresAt <= now) {
        customer.otp = undefined;
        await customer.save();
        throw serviceError('OTP is invalid or expired.', 401);
    }

    if (!await bcrypt.compare(otpCode.trim(), customer.otp.codeHash)) {
        customer.otp.attempts = (customer.otp.attempts || 0) + 1;
        if (customer.otp.attempts >= OTP_MAX_ATTEMPTS) {
            customer.otp.lockedUntil = new Date(now.getTime() + OTP_LOCKOUT_MS);
        }
        await customer.save();
        throw serviceError(
            customer.otp.lockedUntil ? 'Too many incorrect OTP attempts. Try again later.' : 'OTP is invalid or expired.',
            customer.otp.lockedUntil ? 429 : 401
        );
    }

    customer.otp = undefined;
    if (customer.status === 'Suspended') {
        await customer.save();
        throw serviceError('Your account has been suspended. Please contact support.', 403);
    }

    const { accessToken, refreshToken } = generateTokens({ id: customer._id, role: 'customer' });
    customer.refreshToken = refreshToken;
    customer.lastActiveAt = new Date();
    await customer.save();

    return {
        customer: {
            _id: customer._id,
            phone: customer.phone,
            companyName: customer.companyName || '',
            contactPerson: customer.contactPerson || '',
            isProfileComplete: customer.isProfileComplete,
            status: customer.status
        },
        accessToken,
        refreshToken
    };
};

// 3. Refresh Token Service

exports.refreshTokenService = async (incomingRefreshToken) => {
    const decoded = verifyRefreshToken(incomingRefreshToken);

    if (!decoded) {
        throw new Error('Invalid or expired Refresh Token.');
    }

    const customer = await Customer.findById(decoded.id)
        .select('+refreshToken');

    if (!customer || customer.refreshToken !== incomingRefreshToken) {
        throw new Error('Refresh Token mismatch or session expired.');
    }

    const tokens = generateTokens({
        id: customer._id,
        role: 'customer'
    });

    customer.refreshToken = tokens.refreshToken;
    await customer.save();

    return tokens;
};


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

// 6. Logout Service
exports.logoutService = async (customerId) => {
    const customer = await Customer.findById(customerId);
    if (customer) {
        customer.refreshToken = undefined;
        await customer.save();
    }
    return { message: 'Logged out successfully.' };
};  