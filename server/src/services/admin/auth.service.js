const bcrypt = require('bcrypt');
const { randomInt } = require('crypto');
const { AdminOtp } = require('../../models/admin/admin-otp.model');
const { generateAccessToken } = require('../../utils/jwt.util');
const { sendSms } = require('../../utils/twillo');

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_INTERVAL_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

const getAdminPhone = () => {
    const phone = process.env.ADMIN_PHONE?.trim();
    if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
        throw Object.assign(new Error('Admin OTP authentication is not configured.'), { statusCode: 503 });
    }
    return phone;
};

const maskPhone = (phone) => `${phone.slice(0, 3)}******${phone.slice(-2)}`;

exports.sendAdminOtpService = async () => {
    const phone = getAdminPhone();
    const now = new Date();
    const currentOtp = await AdminOtp.findOne({ phone });

    if (currentOtp?.lockedUntil > now) {
        throw Object.assign(new Error('Too many incorrect OTP attempts. Try again later.'), { statusCode: 429 });
    }
    if (currentOtp && now - currentOtp.lastSentAt < RESEND_INTERVAL_MS) {
        throw Object.assign(new Error('Please wait before requesting another OTP.'), { statusCode: 429 });
    }

    const otp = String(randomInt(100000, 1000000));
    const record = await AdminOtp.findOneAndUpdate(
        { phone },
        {
            $set: {
                codeHash: await bcrypt.hash(otp, 10),
                expiresAt: new Date(now.getTime() + OTP_TTL_MS),
                attempts: 0,
                lockedUntil: null,
                lastSentAt: now
            }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    try {
        await sendSms(phone, `Your TMS admin login OTP is ${otp}. It expires in 5 minutes.`);
    } catch (error) {
        await AdminOtp.deleteOne({ _id: record._id });
        throw error;
    }

    return {
        phone: maskPhone(phone),
        expiresIn: 300,
        resendAfter: 60,
        ...(process.env.NODE_ENV !== 'production' ? { mockOtp: otp } : {})
    };
};

exports.verifyAdminOtpService = async (otp) => {
    const phone = getAdminPhone();
    const record = await AdminOtp.findOne({ phone }).select('+codeHash');
    const now = new Date();

    if (!record || record.expiresAt <= now) {
        if (record) await AdminOtp.deleteOne({ _id: record._id });
        throw Object.assign(new Error('OTP is invalid or expired.'), { statusCode: 401 });
    }
    if (record.lockedUntil > now) {
        throw Object.assign(new Error('Too many incorrect OTP attempts. Try again later.'), { statusCode: 429 });
    }

    const matches = await bcrypt.compare(otp, record.codeHash);
    if (!matches) {
        record.attempts += 1;
        if (record.attempts >= MAX_ATTEMPTS) {
            record.lockedUntil = new Date(now.getTime() + LOCKOUT_MS);
        }
        await record.save();
        throw Object.assign(
            new Error(record.lockedUntil ? 'Too many incorrect OTP attempts. Try again later.' : 'OTP is invalid or expired.'),
            { statusCode: record.lockedUntil ? 429 : 401 }
        );
    }

    const accessToken = generateAccessToken({ id: 'configured-admin', role: 'admin' });
    const consumed = await AdminOtp.deleteOne({ _id: record._id, codeHash: record.codeHash });
    if (consumed.deletedCount !== 1) {
        throw Object.assign(new Error('OTP is invalid or expired.'), { statusCode: 401 });
    }

    return { accessToken, tokenType: 'Bearer', expiresIn: 86400 };
};