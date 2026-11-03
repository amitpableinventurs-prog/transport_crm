 
const express = require('express');

const vehicleController = require('../../controllers/fleet/vehicle.controller');

const {
    createVehicleSchema,
    updateVehicleSchema,
    updateVehicleStatusSchema
} = require('../../validations/fleet/vehicle.validation');

const {
    createVehicleAllocationSchema,
    updateAllocationStatusSchema
} = require('../../validations/fleet/vehicleAllocation.validation');

const { validate } = require('../../middlewares/validation.middleware');

const router = express.Router();

// ==========================================
// VEHICLE ROUTES
// ==========================================

// 1. Register Vehicle
router.post(
    '/',
    validate(createVehicleSchema),
    vehicleController.createVehicle
);

// 2. Get All Vehicles
router.get(
    '/',
    vehicleController.getAllVehicles
);

// 3. Fleet Dashboard
router.get(
    '/dashboard',
    vehicleController.getFleetDashboard
);

// ==========================================
// VEHICLE ALLOCATION ROUTES
// ==========================================

// 4. Create Vehicle Allocation
router.post(
    '/allocations',
    validate(createVehicleAllocationSchema),
    vehicleController.createVehicleAllocation
);

// 5. Get All Vehicle Allocations
router.get(
    '/allocations',
    vehicleController.getAllVehicleAllocations
);

// 6. Get Allocation By ID
router.get(
    '/allocations/:allocationId',
    vehicleController.getVehicleAllocationById
);

// 7. Release / Cancel Allocation
router.patch(
    '/allocations/:allocationId/status',
    validate(updateAllocationStatusSchema),
    vehicleController.updateAllocationStatus
);

// ==========================================
// VEHICLE DETAILS ROUTES
// ==========================================

// 8. Get Vehicle By ID
router.get(
    '/:vehicleId',
    vehicleController.getVehicleById
);

// 9. Update Vehicle Details
router.patch(
    '/:vehicleId',
    validate(updateVehicleSchema),
    vehicleController.updateVehicle
);

// 10. Update Vehicle Status
router.patch(
    '/:vehicleId/status',
    validate(updateVehicleStatusSchema),
    vehicleController.updateVehicleStatus
);

// 11. Delete Vehicle
router.delete(
    '/:vehicleId',
    vehicleController.deleteVehicle
);

module.exports = router;
