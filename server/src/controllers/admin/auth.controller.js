const { sendAdminOtpService, verifyAdminOtpService } = require('../../services/admin/auth.service');

exports.sendOtp = async (req, res, next) => {
    try {
        const data = await sendAdminOtpService();
        return res.status(200).json({ success: true, message: 'Admin OTP sent.', data });
    } catch (error) {
        return next(error);
    }
};

exports.verifyOtp = async (req, res, next) => {
    try {
        const data = await verifyAdminOtpService(req.body.otp);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};