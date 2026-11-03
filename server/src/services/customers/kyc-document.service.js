const crypto = require('crypto');
const mongoose = require('mongoose');
const { Customer } = require('../../models/customers/auth.model');
const { CustomerActivity } = require('../../models/customers/activity.model');
const { CustomerKycDocument } = require('../../models/customers/kyc-document.model');

const DOCUMENT_TYPES = ['pan', 'gstin', 'address_proof'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const serviceError = (message, statusCode) => Object.assign(new Error(message), { statusCode });

const getBucket = () => {
    if (!mongoose.connection.db) throw serviceError('Document storage is unavailable.', 503);
    return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'customer_kyc_files' });
};

const verifyFileSignature = (file) => {
    const bytes = file.buffer;
    if (file.mimetype === 'application/pdf') return bytes.subarray(0, 5).toString() === '%PDF-';
    if (file.mimetype === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (file.mimetype === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    return false;
};

const serializeDocument = (document) => ({
    _id: document._id,
    documentType: document.documentType,
    originalName: document.originalName,
    contentType: document.contentType,
    size: document.size,
    status: document.status,
    remarks: document.remarks,
    reviewedBy: document.reviewedBy,
    reviewedAt: document.reviewedAt,
    createdAt: document.createdAt
});

exports.uploadCustomerKycDocumentService = async (customerId, documentType, file) => {
    if (!DOCUMENT_TYPES.includes(documentType)) throw serviceError('Invalid KYC document type.', 400);
    if (!file || !Buffer.isBuffer(file.buffer) || file.size > MAX_FILE_SIZE) throw serviceError('A KYC file up to 5 MB is required.', 400);
    if (!verifyFileSignature(file)) throw serviceError('File content does not match an allowed PDF, JPEG or PNG type.', 415);

    const customer = await Customer.findById(customerId);
    if (!customer) throw serviceError('Customer not found.', 404);
    if (!customer.isProfileComplete) throw serviceError('Complete your profile before uploading KYC documents.', 409);
    if (documentType === 'gstin' && !customer.gstin) throw serviceError('Add GSTIN to your profile before uploading its document.', 409);

    const bucket = getBucket();
    const safeName = file.originalname.replace(/[\\/\r\n]/g, '_').slice(0, 160) || `${documentType}.${file.mimetype.split('/')[1]}`;
    const sha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const uploadStream = bucket.openUploadStream(safeName, {
        contentType: file.mimetype,
        metadata: { customerId: customer._id, documentType, sha256 }
    });

    try {
        await new Promise((resolve, reject) => {
            uploadStream.once('error', reject);
            uploadStream.once('finish', resolve);
            uploadStream.end(file.buffer);
        });

        const document = await CustomerKycDocument.create({
            customerId: customer._id,
            documentType,
            fileId: uploadStream.id,
            originalName: safeName,
            contentType: file.mimetype,
            size: file.size,
            sha256
        });

        await CustomerKycDocument.updateMany(
            { customerId: customer._id, documentType, _id: { $ne: document._id }, status: { $ne: 'Superseded' } },
            { $set: { status: 'Superseded' } }
        );

        customer.markKycNotSubmitted();
        await customer.save();
        await CustomerActivity.create({
            customerId: customer._id,
            type: 'kyc_document_uploaded',
            subject: `KYC ${documentType.replace('_', ' ')} document uploaded`,
            actorId: String(customer._id),
            actorRole: 'customer'
        });

        return serializeDocument(document);
    } catch (error) {
        try { await bucket.delete(uploadStream.id); } catch {}
        throw error;
    }
};

exports.listCustomerKycDocumentsService = async (customerId) => {
    const customer = await Customer.exists({ _id: customerId });
    if (!customer) throw serviceError('Customer not found.', 404);
    const documents = await CustomerKycDocument.find({ customerId }).sort({ createdAt: -1 }).lean();
    return documents.map(serializeDocument);
};

exports.getCustomerKycDocumentStreamService = async (customerId, documentId) => {
    if (!mongoose.Types.ObjectId.isValid(documentId)) throw serviceError('Invalid document ID.', 400);
    const document = await CustomerKycDocument.findOne({ _id: documentId, customerId });
    if (!document) throw serviceError('KYC document not found.', 404);
    return { document: serializeDocument(document), stream: getBucket().openDownloadStream(document.fileId) };
};

exports.listAdminKycDocumentsService = async (customerId) => exports.listCustomerKycDocumentsService(customerId);

exports.reviewCustomerKycDocumentService = async (customerId, documentId, status, remarks, actor) => {
    if (!mongoose.Types.ObjectId.isValid(documentId)) throw serviceError('Invalid document ID.', 400);
    if (!['Verified', 'Rejected'].includes(status)) throw serviceError('Invalid document review status.', 400);

    const [customer, document] = await Promise.all([
        Customer.findById(customerId),
        CustomerKycDocument.findOne({ _id: documentId, customerId })
    ]);
    if (!customer || !document) throw serviceError('Customer or KYC document not found.', 404);
    if (document.status !== 'Pending') throw serviceError('Only pending KYC documents can be reviewed.', 409);
    if (status === 'Rejected' && !remarks.trim()) throw serviceError('A rejection reason is required.', 400);

    document.status = status;
    document.remarks = remarks.trim();
    document.reviewedAt = new Date();
    document.reviewedBy = String(actor.id);
    await document.save();

    if (status === 'Rejected') {
        customer.kycStatus = 'Rejected';
        customer.kycReviewedAt = document.reviewedAt;
        customer.kycReviewedBy = String(actor.id);
        customer.kycRemarks = remarks.trim();
        await customer.save();
    }

    await CustomerActivity.create({
        customerId,
        type: 'kyc_document_reviewed',
        subject: `${document.documentType.replace('_', ' ')} document ${status.toLowerCase()}`,
        description: remarks.trim(),
        actorId: String(actor.id),
        actorRole: actor.role
    });

    return serializeDocument(document);
};

exports.validateRequiredKycDocuments = async () => ({
    requiredTypes: [],
    latest: new Map()
});

exports.validateVerifiedKycDocuments = async (customer) => {
    const { requiredTypes, latest } = await exports.validateRequiredKycDocuments(customer);
    const unverified = requiredTypes.filter((type) => latest.get(type).status !== 'Verified');
    if (unverified.length) {
        throw serviceError(`KYC documents must be verified for: ${unverified.join(', ')}.`, 409);
    }
};