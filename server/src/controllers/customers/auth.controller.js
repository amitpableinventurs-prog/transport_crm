const authService = require('../../services/customers/auth.service');

exports.sendOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        const result = await authService.sendOtpService(phone);
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        return res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        const result = await authService.verifyOtpService(phone, otp);
        return res.status(200).json({ success: true, message: 'Login successful.', ...result });
    } catch (error) {
        return res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
};

exports.refreshTokenController = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const tokens = await authService.refreshTokenService(refreshToken);
        return res.status(200).json({ success: true, ...tokens });
    } catch (error) {
        return res.status(403).json({ success: false, message: error.message });
    }
};

exports.completeProfile = async (req, res) => {
    try {
        const customer = await authService.completeProfileService(req.user.id, req.body);
        return res.status(200).json({ 
            success: true, 
            message: 'Profile completed successfully.', 
            customer 
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const customer = await authService.getProfileService(req.user.id);
        return res.status(200).json({ success: true, customer });
    } catch (error) {
        return res.status(404).json({ success: false, message: error.message });
    }
};

exports.logout = async (req, res) => {
    try {
        const result = await authService.logoutService(req.user.id);
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};