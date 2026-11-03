const express = require('express');
const router = express.Router();
const managerController = require('../../controllers/admin/manager.controller');
const { verifyAccessToken, requireRole } = require('../../middlewares/auth.middleware');
const { validate, validateQuery } = require('../../middlewares/validation.middleware');
const {
    createManagerSchema,
    updateManagerSchema,
    updateManagerStatusSchema,
    managerListQuerySchema
} = require('../../validations/admin/manager.validation');

// Mounted at /api/v1/admin/managers — only the super admin manages manager accounts.
router.use(verifyAccessToken, requireRole('admin'));

router.get('/', validateQuery(managerListQuerySchema), managerController.listManagers);
router.post('/', validate(createManagerSchema), managerController.createManager);
router.patch('/:id/status', validate(updateManagerStatusSchema), managerController.updateManager);
router.patch('/:id', validate(updateManagerSchema), managerController.updateManager);
router.delete('/:id', managerController.deleteManager);

module.exports = router;
