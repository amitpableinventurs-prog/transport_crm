const express = require('express');

const driverController = require('../../controllers/driver/driverAuth.controller');
const { verifyAccessToken, requireRole } = require('../../middlewares/auth.middleware');
const { validateQuery } = require('../../middlewares/validation.middleware');
const { performanceQuerySchema } = require('../../validations/driver/driver.validation');

const router = express.Router();

router.use(verifyAccessToken, requireRole('admin'));
router.get('/', validateQuery(performanceQuerySchema), driverController.getDriverPerformanceReport);

module.exports = router;
