const managerService = require('../../services/admin/manager.service');

const handle = (work, successStatus = 200) => async (req, res, next) => {
    try {
        const result = await work(req);
        return res.status(successStatus).json({ success: true, ...result });
    } catch (error) {
        return next(error);
    }
};

exports.listManagers = handle(async (req) => managerService.listManagers(req.validatedQuery));

exports.createManager = handle(async (req) => ({
    message: 'Manager account created.',
    data: await managerService.createManager(req.body, req.user)
}), 201);

exports.updateManager = handle(async (req) => ({
    message: 'Manager account updated.',
    data: await managerService.updateManager(req.params.id, req.body)
}));

exports.deleteManager = handle(async (req) => {
    await managerService.deleteManager(req.params.id);
    return { message: 'Manager account deleted.' };
});
