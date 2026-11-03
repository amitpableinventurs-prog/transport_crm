const authService = require('../../services/customers/auth.service');

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
