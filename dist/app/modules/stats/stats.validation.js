"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsService = void 0;
const booking_model_1 = require("../booking/booking.model");
const getDashboardData = async () => {
    var _a;
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const [totalClients, activeServices, totalRevenue, activeStaff, monthlyBookings, monthlyRevenue,] = await Promise.all([
        // Total Clients
        booking_model_1.Booking.distinct('user').countDocuments(),
        // Active Services (last month)
        booking_model_1.Booking.distinct('service', {
            createdAt: { $gte: startOfLastMonth },
        }).countDocuments(),
        // Total Revenue
        booking_model_1.Booking.aggregate([{ $group: { _id: null, total: { $sum: '$price' } } }]),
        // Active Staff
        booking_model_1.Booking.distinct('staff', {
            createdAt: { $gte: startOfLastMonth },
        }).countDocuments(),
        // Monthly bookings
        booking_model_1.Booking.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]),
        // Monthly revenue
        booking_model_1.Booking.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    revenue: { $sum: '$price' },
                },
            },
            { $sort: { _id: 1 } },
        ]),
    ]);
    return {
        totalClients,
        activeServices,
        totalRevenue: ((_a = totalRevenue[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
        activeStaff,
        monthlyBookings,
        monthlyRevenue,
    };
};
exports.StatsService = {
    getDashboardData,
};
