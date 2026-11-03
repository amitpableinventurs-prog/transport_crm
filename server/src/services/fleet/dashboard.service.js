

const { Vehicle } = require('../../models/fleet/vehicle.model');

// Get Fleet Dashboard Statistics
const getFleetDashboard = async () => {
    const [result] = await Vehicle.aggregate([
        {
            $match: {
                isDeleted: false
            }
        },
        {
            $facet: {
                // Status-wise Vehicle Summary
                summary: [
                    {
                        $group: {
                            _id: null,

                            totalVehicles: {
                                $sum: 1
                            },

                            availableVehicles: {
                                $sum: {
                                    $cond: [
                                        { $eq: ['$vehicleStatus', 'Available'] },
                                        1,
                                        0
                                    ]
                                }
                            },

                            allocatedVehicles: {
                                $sum: {
                                    $cond: [
                                        { $eq: ['$vehicleStatus', 'Allocated'] },
                                        1,
                                        0
                                    ]
                                }
                            },

                            onTripVehicles: {
                                $sum: {
                                    $cond: [
                                        { $eq: ['$vehicleStatus', 'OnTrip'] },
                                        1,
                                        0
                                    ]
                                }
                            },

                            maintenanceVehicles: {
                                $sum: {
                                    $cond: [
                                        { $eq: ['$vehicleStatus', 'UnderMaintenance'] },
                                        1,
                                        0
                                    ]
                                }
                            },

                            inactiveVehicles: {
                                $sum: {
                                    $cond: [
                                        { $eq: ['$vehicleStatus', 'Inactive'] },
                                        1,
                                        0
                                    ]
                                }
                            }
                        }
                    }
                ],

                // Vehicle Type Breakdown
                vehicleTypeBreakdown: [
                    {
                        $group: {
                            _id: '$vehicleType',
                            count: {
                                $sum: 1
                            }
                        }
                    },
                    {
                        $sort: {
                            count: -1
                        }
                    }
                ]
            }
        }
    ]);

    const summary = result?.summary?.[0] || {
        totalVehicles: 0,
        availableVehicles: 0,
        allocatedVehicles: 0,
        onTripVehicles: 0,
        maintenanceVehicles: 0,
        inactiveVehicles: 0
    };

    // Calculate operational and busy vehicles
    const operationalVehicles =
        summary.totalVehicles -
        summary.maintenanceVehicles -
        summary.inactiveVehicles;

    const busyVehicles =
        summary.allocatedVehicles +
        summary.onTripVehicles;

    // Calculate fleet utilization percentage
    const utilizationRate = operationalVehicles > 0
        ? Number(
            ((busyVehicles / operationalVehicles) * 100).toFixed(2)
        )
        : 0;

    return {
        summary: {
            ...summary,
            utilizationRate
        },
        vehicleTypeBreakdown: result?.vehicleTypeBreakdown || []
    };
};

module.exports = {
    getFleetDashboard
};
