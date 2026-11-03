const portalService = require('../../services/customers/portal.service');
const kycDocumentService = require('../../services/customers/kyc-document.service');

const streamKycDocument = ({ document, stream }, response, next) => {
    response.set({
        'Content-Type': document.contentType,
        'Content-Length': document.size,
        'Content-Disposition': `attachment; filename="${document.originalName.replace(/["\\\r\n]/g, '_')}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff'
    });
    stream.on('error', next).pipe(response);
};

// ---------- Dashboard ----------
exports.getDashboard = async (req, res, next) => {
    try {
        const data = await portalService.getDashboardService(req.user.id);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// ---------- Profile ----------
exports.getProfile = async (req, res, next) => {
    try {
        const data = await portalService.getProfileService(req.user.id);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const data = await portalService.updateProfileService(
            req.user.id,
            req.body
        );
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully.',
            data
        });
    } catch (error) {
        next(error);
    }
};

// ---------- Preferences ----------
exports.getPreferences = async (req, res, next) => {
    try {
        const data = await portalService.getPreferencesService(req.user.id);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

exports.updatePreferences = async (req, res, next) => {
    try {
        const data = await portalService.updatePreferencesService(
            req.user.id,
            req.body
        );
        res.status(200).json({
            success: true,
            message: 'Preferences updated successfully.',
            data
        });
    } catch (error) {
        next(error);
    }
};

// ---------- Addresses ----------
exports.listAddresses = async (req, res, next) => {
    try {
        const data = await portalService.listAddressesService(req.user.id);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

exports.addAddress = async (req, res, next) => {
    try {
        const data = await portalService.addAddressService(
            req.user.id,
            req.body
        );
        res.status(201).json({
            success: true,
            message: 'Address added successfully.',
            data
        });
    } catch (error) {
        next(error);
    }
};

exports.updateAddress = async (req, res, next) => {
    try {
        const data = await portalService.updateAddressService(
            req.user.id,
            req.params.id,
            req.body
        );
        res.status(200).json({
            success: true,
            message: 'Address updated successfully.',
            data
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteAddress = async (req, res, next) => {
    try {
        const data = await portalService.deleteAddressService(
            req.user.id,
            req.params.id
        );
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        next(error);
    }
};

exports.submitKyc = async (req, res, next) => {
    try {
        const data = await portalService.submitKycService(req.user.id);
        return res.status(200).json({ success: true, message: 'KYC submitted for review.', data });
    } catch (error) {
        return next(error);
    }
};

exports.uploadKycDocument = async (req, res, next) => {
    try {
        const data = await kycDocumentService.uploadCustomerKycDocumentService(
            req.user.id,
            req.body.documentType,
            req.file
        );
        return res.status(201).json({ success: true, message: 'KYC document uploaded.', data });
    } catch (error) {
        return next(error);
    }
};

exports.listKycDocuments = async (req, res, next) => {
    try {
        const data = await kycDocumentService.listCustomerKycDocumentsService(req.user.id);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

exports.downloadKycDocument = async (req, res, next) => {
    try {
        const result = await kycDocumentService.getCustomerKycDocumentStreamService(req.user.id, req.params.documentId);
        return streamKycDocument(result, res, next);
    } catch (error) {
        return next(error);
    }
};