 
const vehicleService = require('../../services/fleet/vehicle.service');
const dashboardService = require('../../services/fleet/dashboard.service');
const allocationService = require('../../services/fleet/vehicleAllocation.service');

// ==========================================
// 1. CREATE VEHICLE
// ==========================================

const createVehicle = async (req, res, next) => {
    try {
        const vehicle = await vehicleService.createVehicle(req.body);

        return res.status(201).json({
            success: true,
            message: 'Vehicle registered successfully',
            data: vehicle
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 2. GET ALL VEHICLES
// ==========================================

const getAllVehicles = async (req, res, next) => {
    try {
        const result = await vehicleService.getAllVehicles(req.query);

        return res.status(200).json({
            success: true,
            message: 'Vehicles fetched successfully',
            data: result.vehicles,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 3. GET VEHICLE BY ID
// ==========================================

const getVehicleById = async (req, res, next) => {
    try {
        const vehicle = await vehicleService.getVehicleById(
            req.params.vehicleId
        );

        return res.status(200).json({
            success: true,
            message: 'Vehicle fetched successfully',
            data: vehicle
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 4. UPDATE VEHICLE
// ==========================================

const updateVehicle = async (req, res, next) => {
    try {
        const vehicle = await vehicleService.updateVehicle(
            req.params.vehicleId,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: 'Vehicle updated successfully',
            data: vehicle
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 5. UPDATE VEHICLE STATUS
// ==========================================

const updateVehicleStatus = async (req, res, next) => {
    try {
        const vehicle = await vehicleService.updateVehicleStatus(
            req.params.vehicleId,
            req.body.vehicleStatus
        );

        return res.status(200).json({
            success: true,
            message: 'Vehicle status updated successfully',
            data: vehicle
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 6. DELETE VEHICLE
// ==========================================

const deleteVehicle = async (req, res, next) => {
    try {
        const result = await vehicleService.deleteVehicle(
            req.params.vehicleId
        );

        return res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 7. GET FLEET DASHBOARD
// ==========================================

const getFleetDashboard = async (req, res, next) => {
    try {
        const dashboard = await dashboardService.getFleetDashboard();

        return res.status(200).json({
            success: true,
            message: 'Fleet dashboard fetched successfully',
            data: dashboard
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 8. CREATE VEHICLE ALLOCATION
// ==========================================

const createVehicleAllocation = async (req, res, next) => {
    try {
        const allocatedBy = req.user?._id || req.user?.id || null;

        const allocation =
            await allocationService.createVehicleAllocation(
                req.body,
                allocatedBy
            );

        return res.status(201).json({
            success: true,
            message: 'Vehicle allocated successfully',
            data: allocation
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 9. GET ALL VEHICLE ALLOCATIONS
// ==========================================

const getAllVehicleAllocations = async (req, res, next) => {
    try {
        const result =
            await allocationService.getAllVehicleAllocations(req.query);

        return res.status(200).json({
            success: true,
            message: 'Vehicle allocations fetched successfully',
            data: result.allocations,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 10. GET ALLOCATION BY ID
// ==========================================

const getVehicleAllocationById = async (req, res, next) => {
    try {
        const allocation =
            await allocationService.getVehicleAllocationById(
                req.params.allocationId
            );

        return res.status(200).json({
            success: true,
            message: 'Vehicle allocation fetched successfully',
            data: allocation
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 11. RELEASE / CANCEL ALLOCATION
// ==========================================

const updateAllocationStatus = async (req, res, next) => {
    try {
        const releasedBy = req.user?._id || req.user?.id || null;

        const allocation =
            await allocationService.updateAllocationStatus(
                req.params.allocationId,
                req.body,
                releasedBy
            );

        return res.status(200).json({
            success: true,
            message: `Vehicle allocation ${req.body.allocationStatus.toLowerCase()} successfully`,
            data: allocation
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    createVehicle,
    getAllVehicles,
    getVehicleById,
    updateVehicle,
    updateVehicleStatus,
    deleteVehicle,
    getFleetDashboard,

    createVehicleAllocation,
    getAllVehicleAllocations,
    getVehicleAllocationById,
    updateAllocationStatus
};
