const managementService = require('../../services/customers/management.service');
const kycDocumentService = require('../../services/customers/kyc-document.service');
const {
    validateCustomerListQuery,
    validateCustomerStatusUpdate,
    validateCustomerProfileUpdate,
    validateCustomerKycReview,
    validateCustomerActivityQuery,
    validateCustomerActivityCreate,
    validateCustomerRegistration
} = require('../../validations/customers/auth.validation');

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

exports.getCustomerSummary = async (req, res, next) => {
    try {
        const data = await managementService.getCustomerManagementSummaryService();
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

exports.listCustomers = async (req, res, next) => {
    try {
        const { error } = validateCustomerListQuery(req.query);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const data = await managementService.listCustomersService(req.query);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

exports.getCustomerById = async (req, res, next) => {
    try {
        const data = await managementService.getCustomerByIdService(req.params.id);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

exports.createCustomerRegistration = async (req, res, next) => {
    try {
        const { error, value } = validateCustomerRegistration(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const data = await managementService.createCustomerRegistrationService(value);
        return res.status(201).json({ success: true, message: 'Customer registered successfully.', data });
    } catch (error) {
        return next(error);
    }
};

exports.updateCustomerRegistration = async (req, res, next) => {
    try {
        const { error, value } = validateCustomerRegistration(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const data = await managementService.updateCustomerRegistrationService(req.params.id, value);
        return res.status(200).json({ success: true, message: 'Customer details updated successfully.', data });
    } catch (error) {
        return next(error);
    }
};

exports.updateCustomerStatus = async (req, res, next) => {
    try {
        const { error } = validateCustomerStatusUpdate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const data = await managementService.updateCustomerStatusService(
            req.params.id,
            req.body.status,
            req.body.remarks || '',
            req.user
        );

        return res.status(200).json({
            success: true,
            message: 'Customer status updated successfully.',
            data
        });
    } catch (error) {
        return next(error);
    }
};

exports.updateCustomerProfile = async (req, res, next) => {
    try {
        const { error } = validateCustomerProfileUpdate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const data = await managementService.updateCustomerProfileService(req.params.id, req.body, req.user);
        return res.status(200).json({
            success: true,
            message: 'Customer profile updated successfully.',
            data
        });
    } catch (error) {
        return next(error);
    }
};

exports.reviewCustomerKyc = async (req, res, next) => {
    try {
        const { error } = validateCustomerKycReview(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const data = await managementService.reviewCustomerKycService(
            req.params.id,
            req.body.status,
            req.body.remarks || '',
            req.user
        );
        return res.status(200).json({ success: true, message: 'Customer KYC review saved.', data });
    } catch (error) {
        return next(error);
    }
};

exports.listCustomerKycDocuments = async (req, res, next) => {
    try {
        const data = await kycDocumentService.listAdminKycDocumentsService(req.params.id);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

exports.reviewCustomerKycDocument = async (req, res, next) => {
    try {
        const { error } = validateCustomerKycReview(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const data = await kycDocumentService.reviewCustomerKycDocumentService(
            req.params.id,
            req.params.documentId,
            req.body.status,
            req.body.remarks || '',
            req.user
        );
        return res.status(200).json({ success: true, message: 'KYC document review saved.', data });
    } catch (error) {
        return next(error);
    }
};

exports.downloadCustomerKycDocument = async (req, res, next) => {
    try {
        const result = await kycDocumentService.getCustomerKycDocumentStreamService(req.params.id, req.params.documentId);
        return streamKycDocument(result, res, next);
    } catch (error) {
        return next(error);
    }
};

exports.listCustomerActivities = async (req, res, next) => {
    try {
        const { error } = validateCustomerActivityQuery(req.query);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const data = await managementService.listCustomerActivitiesService(req.params.id, req.query);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

exports.createCustomerActivity = async (req, res, next) => {
    try {
        const { error } = validateCustomerActivityCreate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const data = await managementService.createCustomerActivityService(req.params.id, req.body, req.user);
        return res.status(201).json({ success: true, message: 'Customer activity recorded.', data });
    } catch (error) {
        return next(error);
    }
};

exports.completeCustomerFollowUp = async (req, res, next) => {
    try {
        const data = await managementService.completeCustomerFollowUpService(req.params.id, req.params.activityId);
        return res.status(200).json({ success: true, message: 'Follow-up completed.', data });
    } catch (error) {
        return next(error);
    }
};
