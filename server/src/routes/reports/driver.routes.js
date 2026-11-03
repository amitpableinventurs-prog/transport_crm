const express = require('express');

const driverController = require('../../controllers/driver/driverAuth.controller');
const { verifyAccessToken, requireRole, STAFF_ROLES } = require('../../middlewares/auth.middleware');
const { validateQuery } = require('../../middlewares/validation.middleware');
const { performanceQuerySchema } = require('../../validations/driver/driver.validation');

const router = express.Router();

router.use(verifyAccessToken, requireRole(...STAFF_ROLES));
router.get('/', validateQuery(performanceQuerySchema), driverController.getDriverPerformanceReport);

module.exports = router;
