const mongoose = require('mongoose');
const { Manager } = require('../../models/auth/manager.model');
const { revokeSessionsFor, deleteAccountFor } = require('../auth/auth.service');

const serviceError = (message, statusCode) => Object.assign(new Error(message), { statusCode });
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findManager = async (id) => {
    if (!mongoose.isValidObjectId(id)) throw serviceError('Invalid manager ID.', 400);
    const manager = await Manager.findById(id);
    if (!manager) throw serviceError('Manager not found.', 404);
    return manager;
};

const rethrowDuplicate = (error) => {
    if (error?.code === 11000) throw serviceError('A manager with this mobile number already exists.', 409);
    throw error;
};

exports.listManagers = async ({ page = 1, limit = 20, search, status }) => {
    const filter = {};
    if (status) filter.status = status;
    if (search) {
        const pattern = new RegExp(escapeRegex(search), 'i');
        filter.$or = [{ fullName: pattern }, { phone: pattern }, { email: pattern }, { branch: pattern }];
    }

    const [data, total] = await Promise.all([
        Manager.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Manager.countDocuments(filter)
    ]);
    return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

exports.createManager = async (data, actor) => {
    try {
        return await Manager.create({ ...data, createdBy: String(actor.id) });
    } catch (error) {
        return rethrowDuplicate(error);
    }
};

exports.updateManager = async (id, data) => {
    const manager = await findManager(id);
    const wasActive = manager.status === 'Active';
    manager.set(data);
    try {
        await manager.save();
    } catch (error) {
        return rethrowDuplicate(error);
    }
    // Deactivating a manager signs them out immediately.
    if (wasActive && manager.status !== 'Active') await revokeSessionsFor('manager', manager._id);
    return manager;
};

exports.deleteManager = async (id) => {
    const manager = await findManager(id);
    await manager.deleteOne();
    await deleteAccountFor('manager', manager._id);
};
