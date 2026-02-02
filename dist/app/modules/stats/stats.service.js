"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsServices = void 0;
const user_1 = require("../../../enum/user");
const booking_model_1 = require("../booking/booking.model");
const review_model_1 = require("../review/review.model");
const service_model_1 = require("../service/service.model");
const subscription_model_1 = require("../subscription/subscription.model");
const support_model_1 = require("../support/support.model");
const user_model_1 = require("../user/user.model");
// Helper function to get month name
const getMonthName = (monthIndex) => {
    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];
    return months[monthIndex];
};
// Helper function to ensure all months are included
const fillMissingMonths = (data, months = 6) => {
    const result = [];
    const endDate = new Date();
    for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(endDate.getMonth() - i);
        const monthName = getMonthName(date.getMonth());
        const existingData = data.find(item => item.month === monthName);
        if (existingData) {
            result.push(existingData);
        }
        else {
            // Push zero values for missing months
            if ('count' in data[0]) {
                result.push({ month: monthName, count: 0 });
            }
            else if ('revenue' in data[0]) {
                result.push({ month: monthName, revenue: 0 });
            }
        }
    }
    return result;
};
// 1. Service Requests - Monthly service bookings over time
const getServiceRequests = async (months = 6) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    const serviceRequests = await booking_model_1.Booking.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate,
                },
            },
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                },
                count: { $sum: 1 },
            },
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1 },
        },
        {
            $project: {
                month: {
                    $let: {
                        vars: {
                            monthsInYear: [
                                'Jan',
                                'Feb',
                                'Mar',
                                'Apr',
                                'May',
                                'Jun',
                                'Jul',
                                'Aug',
                                'Sep',
                                'Oct',
                                'Nov',
                                'Dec',
                            ],
                        },
                        in: {
                            $arrayElemAt: [
                                '$$monthsInYear',
                                { $subtract: ['$_id.month', 1] },
                            ],
                        },
                    },
                },
                count: 1,
            },
        },
    ]);
    // Fill in missing months with zero values
    const filledData = fillMissingMonths(serviceRequests.map(item => ({
        month: item.month,
        count: item.count,
    })), months);
    return filledData;
};
// 2. Revenue Trend - Monthly revenue over time
const getRevenueTrend = async (months = 6) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    const revenueTrend = await booking_model_1.Booking.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate,
                },
                status: { $nin: ['cancelled'] }, // Exclude cancelled bookings
            },
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                },
                revenue: { $sum: '$price' },
            },
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1 },
        },
        {
            $project: {
                month: {
                    $let: {
                        vars: {
                            monthsInYear: [
                                'Jan',
                                'Feb',
                                'Mar',
                                'Apr',
                                'May',
                                'Jun',
                                'Jul',
                                'Aug',
                                'Sep',
                                'Oct',
                                'Nov',
                                'Dec',
                            ],
                        },
                        in: {
                            $arrayElemAt: [
                                '$$monthsInYear',
                                { $subtract: ['$_id.month', 1] },
                            ],
                        },
                    },
                },
                revenue: { $round: ['$revenue', 2] }, // Round to 2 decimal places
            },
        },
    ]);
    // Fill in missing months with zero values
    const filledData = fillMissingMonths(revenueTrend.map(item => ({
        month: item.month,
        revenue: item.revenue,
    })), months);
    return filledData;
};
// 3. Complete Dashboard Data (combines all)
const getDashboardData = async () => {
    var _a;
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    // Get last 6 months of data for charts
    const [totalClients, activeServices, totalRevenue, activeStaff, serviceRequests, revenueTrend,] = await Promise.all([
        // Total Clients (all time)
        booking_model_1.Booking.distinct('user').countDocuments(),
        // Active Services (last month - distinct services booked)
        booking_model_1.Booking.distinct('service', {
            createdAt: {
                $gte: startOfLastMonth,
                $lte: endOfLastMonth,
            },
            status: { $nin: ['cancelled'] },
        }).countDocuments(),
        // Total Revenue (all time)
        booking_model_1.Booking.aggregate([
            {
                $match: { status: { $nin: ['cancelled'] } },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$price' },
                },
            },
        ]),
        // Active Staff (last month - distinct staff assigned)
        booking_model_1.Booking.distinct('staff', {
            createdAt: {
                $gte: startOfLastMonth,
                $lte: endOfLastMonth,
            },
            status: { $nin: ['cancelled'] },
        }).countDocuments(),
        // Service Requests (last 6 months)
        getServiceRequests(6),
        // Revenue Trend (last 6 months)
        getRevenueTrend(6),
    ]);
    return {
        totalClients,
        activeServices,
        totalRevenue: ((_a = totalRevenue[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
        activeStaff,
        serviceRequests,
        revenueTrend,
    };
};
// Get client statistics
const getClientStats = async () => {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    // Get all stats in parallel for better performance
    const [totalClients, premiumMembers, activeThisMonth, newThisMonth, lastMonthClients,] = await Promise.all([
        // Total Clients (users with role = CLIENT)
        user_model_1.User.countDocuments({ role: user_1.USER_ROLES.CLIENT }),
        // Premium Members (users with active subscription)
        user_model_1.User.countDocuments({
            role: user_1.USER_ROLES.CLIENT,
            _id: {
                $in: await subscription_model_1.Subscription.distinct('user', {
                    status: 'active',
                    currentPeriodEnd: { $gte: new Date().toISOString() },
                }),
            },
        }),
        // Active This Month (clients who booked this month)
        user_model_1.User.countDocuments({
            role: user_1.USER_ROLES.CLIENT,
            _id: {
                $in: await booking_model_1.Booking.distinct('user', {
                    createdAt: { $gte: startOfCurrentMonth },
                    status: { $nin: ['cancelled'] },
                }),
            },
        }),
        // New This Month (clients created this month)
        user_model_1.User.countDocuments({
            role: user_1.USER_ROLES.CLIENT,
            createdAt: { $gte: startOfCurrentMonth },
        }),
        // Last month total for growth calculation
        user_model_1.User.countDocuments({
            role: user_1.USER_ROLES.CLIENT,
            createdAt: { $lt: startOfCurrentMonth },
        }),
    ]);
    // Calculate growth rate
    const growthRate = lastMonthClients > 0
        ? ((totalClients - lastMonthClients) / lastMonthClients) * 100
        : totalClients > 0
            ? 100
            : 0;
    // Calculate premium percentage
    const premiumPercentage = totalClients > 0 ? (premiumMembers / totalClients) * 100 : 0;
    return {
        totalClients,
        premiumMembers,
        activeThisMonth,
        newThisMonth,
        growthRate: Math.round(growthRate * 10) / 10, // Round to 1 decimal
        premiumPercentage: Math.round(premiumPercentage * 10) / 10,
    };
};
// Get staff statistics
const getStaffStats = async () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    // Get total staff count
    const totalStaff = await user_model_1.User.countDocuments({ role: user_1.USER_ROLES.STAFF });
    if (totalStaff === 0) {
        return {
            totalStaff: 0,
            activeToday: 0,
            averageRating: 0,
            servicesThisMonth: 0,
            availableStaff: 0,
            occupiedStaff: 0,
        };
    }
    // Get staff who are active today (have bookings today)
    const activeStaffToday = await booking_model_1.Booking.distinct('staff', {
        date: { $gte: startOfToday },
        status: { $nin: ['cancelled'] },
    });
    // Get services created by staff this month
    const servicesThisMonth = await service_model_1.Service.countDocuments({
        createdAt: { $gte: startOfCurrentMonth },
    });
    // Calculate average rating for staff
    const averageRating = await calculateAverageStaffRating();
    // Get available vs occupied staff for today
    const todayBookings = await booking_model_1.Booking.find({
        date: { $gte: startOfToday },
        status: { $nin: ['cancelled'] },
    }).select('staff');
    const occupiedStaffIds = [
        ...new Set(todayBookings.map(booking => booking.staff.toString())),
    ];
    const availableStaff = totalStaff - occupiedStaffIds.length;
    return {
        totalStaff,
        activeToday: activeStaffToday.length,
        averageRating,
        servicesThisMonth,
        availableStaff,
        occupiedStaff: occupiedStaffIds.length,
    };
};
// Calculate average rating for all staff
const calculateAverageStaffRating = async () => {
    // Get all services created by staff
    const services = await service_model_1.Service.find({}).select('_id createdBy');
    // Create a map of service IDs to their creator (staff)
    const serviceToStaffMap = new Map();
    services.forEach(service => {
        if (service.createdBy) {
            serviceToStaffMap.set(service._id.toString(), service.createdBy.toString());
        }
    });
    // Get all reviews for these services
    const reviews = await review_model_1.Review.find({
        service: { $in: Array.from(serviceToStaffMap.keys()) },
        status: 'approved',
    });
    if (reviews.length === 0)
        return 0;
    // Group ratings by staff
    const staffRatings = new Map();
    // reviews.forEach(review => {
    //   const staffId = serviceToStaffMap.get(review.service.toString())
    //   if (staffId) {
    //     if (!staffRatings.has(staffId)) {
    //       staffRatings.set(staffId, { total: 0, count: 0 })
    //     }
    //     const current = staffRatings.get(staffId)!
    //     staffRatings.set(staffId, {
    //       total: current.total + review.rating,
    //       count: current.count + 1,
    //     })
    //   }
    // })
    // Calculate overall average
    let totalRating = 0;
    let totalReviews = 0;
    staffRatings.forEach(value => {
        totalRating += value.total;
        totalReviews += value.count;
    });
    const average = totalReviews > 0 ? totalRating / totalReviews : 0;
    return Math.round(average * 10) / 10; // Round to 1 decimal
};
// Get service statistics
const getServiceStats = async () => {
    var _a;
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    // Get all stats in parallel
    const [totalServices, activeServices, totalBookings, averagePrice] = await Promise.all([
        // Total Services
        service_model_1.Service.countDocuments(),
        // Active Services (services with bookings in last month)
        service_model_1.Service.countDocuments({
            _id: {
                $in: await booking_model_1.Booking.distinct('service', {
                    createdAt: { $gte: startOfLastMonth },
                    status: { $nin: ['cancelled'] },
                }),
            },
        }),
        // Total Bookings (all time, excluding cancelled)
        booking_model_1.Booking.countDocuments({ status: { $nin: ['cancelled'] } }),
        // Average Price (of all bookings)
        booking_model_1.Booking.aggregate([
            {
                $match: { status: { $nin: ['cancelled'] } },
            },
            {
                $group: {
                    _id: null,
                    avgPrice: { $avg: '$price' },
                    count: { $sum: 1 },
                },
            },
        ]),
    ]);
    return {
        totalServices,
        activeServices,
        totalBookings,
        averagePrice: ((_a = averagePrice[0]) === null || _a === void 0 ? void 0 : _a.avgPrice)
            ? Math.round(averagePrice[0].avgPrice * 100) / 100
            : 0,
    };
};
// Helper function to get subscription stats
const getSubscriptionStats = async () => {
    const result = await subscription_model_1.Subscription.aggregate([
        {
            $match: {
                status: 'active',
                currentPeriodEnd: { $gte: new Date().toISOString() },
            },
        },
        {
            $group: {
                _id: null,
                revenue: { $sum: '$price' },
                count: { $sum: 1 },
            },
        },
    ]);
    return result[0] || { revenue: 0, count: 0 };
};
// Helper function to get booking stats by status
const getBookingStats = async () => {
    const result = await booking_model_1.Booking.aggregate([
        {
            $group: {
                _id: '$status',
                revenue: { $sum: '$price' },
                count: { $sum: 1 },
            },
        },
    ]);
    return result.reduce((acc, curr) => {
        acc[curr._id] = { revenue: curr.revenue, count: curr.count };
        return acc;
    }, {});
};
// Main payment stats function
const getPaymentStatsClean = async () => {
    var _a;
    const [subscription, bookings] = await Promise.all([
        getSubscriptionStats(),
        getBookingStats(),
    ]);
    // Define status groups
    const completedStatuses = [
        'completed',
        'confirmed',
        'inProgress',
        'scheduled',
    ];
    const pendingStatuses = ['requested', 'scheduled'];
    // Calculate totals
    let totalRevenue = subscription.revenue;
    let totalBookings = 0;
    let pendingBookings = 0;
    let refundRequests = ((_a = bookings.cancelled) === null || _a === void 0 ? void 0 : _a.count) || 0;
    completedStatuses.forEach(status => {
        const booking = bookings[status];
        if (booking) {
            totalRevenue += booking.revenue;
            totalBookings += booking.count;
        }
    });
    pendingStatuses.forEach(status => {
        const booking = bookings[status];
        if (booking) {
            pendingBookings += booking.count;
        }
    });
    const totalCompletedPayments = subscription.count + totalBookings;
    const averageTransaction = totalCompletedPayments > 0 ? totalRevenue / totalCompletedPayments : 0;
    return {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        completedPayments: totalCompletedPayments,
        pendingPayments: pendingBookings,
        refundRequests: refundRequests,
        averageTransaction: Math.round(averageTransaction * 100) / 100,
        revenueGrowth: 0, // Add growth calculation separately if needed
    };
};
const getReviewSupportStatsSimple = async () => {
    var _a, _b, _c;
    const [reviewData, supportData] = await Promise.all([
        // Get review stats
        review_model_1.Review.aggregate([
            {
                $facet: {
                    averageRating: [
                        {
                            $group: {
                                _id: null,
                                avg: { $avg: '$rating' },
                            },
                        },
                    ],
                    pendingCount: [
                        {
                            $match: { status: 'pending' },
                        },
                        {
                            $count: 'count',
                        },
                    ],
                    approvedRatings: [
                        {
                            $match: { status: 'approved' },
                        },
                        {
                            $group: {
                                _id: null,
                                avg: { $avg: '$rating' },
                                count: { $sum: 1 },
                            },
                        },
                    ],
                },
            },
        ]),
        // Get support stats
        support_model_1.Support.aggregate([
            {
                $match: {
                    status: { $in: ['open', 'in_progress'] }, // Assuming these are open statuses
                },
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                },
            },
        ]),
    ]);
    const avgRating = ((_a = reviewData[0].averageRating[0]) === null || _a === void 0 ? void 0 : _a.avg) || 0;
    const pendingReviews = ((_b = reviewData[0].pendingCount[0]) === null || _b === void 0 ? void 0 : _b.count) || 0;
    const approvedStats = reviewData[0].approvedRatings[0] || { avg: 0, count: 0 };
    const openIssues = ((_c = supportData[0]) === null || _c === void 0 ? void 0 : _c.count) || 0;
    // Calculate satisfaction rate (percentage of 4+ star average)
    const satisfactionRate = approvedStats.avg >= 4 ? 100 : (approvedStats.avg / 5) * 100;
    return {
        averageRating: Math.round(avgRating * 10) / 10,
        pendingReviews,
        openIssues,
        satisfactionRate: Math.round(satisfactionRate * 10) / 10,
    };
};
const getProviderDashboard = async (providerId) => {
    var _a;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Calculate start of week (Monday)
    const startOfWeek = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    // Get all stats in parallel
    const [todayServices, completedServices, totalServices, servicesThisWeek, yourRatingData, averageRatingData, totalEarnings, scheduledServices,] = await Promise.all([
        // Today's services (bookings assigned to this provider today)
        booking_model_1.Booking.countDocuments({
            staff: providerId,
            date: { $gte: today, $lt: tomorrow },
            status: { $nin: ['cancelled'] },
        }),
        // Completed services
        booking_model_1.Booking.countDocuments({
            staff: providerId,
            status: 'completed',
        }),
        // Total services (all bookings assigned to this provider)
        booking_model_1.Booking.countDocuments({
            staff: providerId,
            status: { $nin: ['cancelled'] },
        }),
        // Services this week
        booking_model_1.Booking.countDocuments({
            staff: providerId,
            date: { $gte: startOfWeek, $lt: tomorrow },
            status: { $nin: ['cancelled'] },
        }),
        // Your rating (reviews for services provided by this staff)
        getProviderRating(providerId),
        // Average rating (average of all staff ratings)
        getAverageStaffRating(),
        // Total earnings
        booking_model_1.Booking.aggregate([
            {
                $match: {
                    staff: providerId,
                    status: { $nin: ['cancelled'] },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$price' },
                },
            },
        ]),
        // Scheduled services
        booking_model_1.Booking.countDocuments({
            staff: providerId,
            date: { $gte: today },
            status: { $in: ['confirmed', 'scheduled', 'requested'] },
        }),
    ]);
    return {
        todayServices,
        scheduledServices,
        completedServices,
        totalServices,
        servicesThisWeek, // New field added
        yourRating: yourRatingData.averageRating,
        averageRating: averageRatingData,
        totalEarnings: ((_a = totalEarnings[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
    };
};
const getAverageStaffRating = async () => {
    // Get all services created by staff
    const services = await service_model_1.Service.find({
        createdBy: { $exists: true, $ne: null },
    }).select('_id createdBy');
    const serviceToStaffMap = new Map();
    services.forEach(service => {
        serviceToStaffMap.set(service._id.toString(), service.createdBy.toString());
    });
    const reviews = await review_model_1.Review.find({
        service: { $in: Array.from(serviceToStaffMap.keys()) },
        status: 'approved',
    });
    if (reviews.length === 0)
        return 0;
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    return Math.round(averageRating * 10) / 10;
};
// Get provider's rating (reviews for services they provided)
const getProviderRating = async (providerId) => {
    var _a, _b;
    // Get all services created by this provider
    const services = await service_model_1.Service.find({ createdBy: providerId }).select('_id');
    const serviceIds = services.map(service => service._id);
    if (serviceIds.length === 0) {
        return { averageRating: 0, totalReviews: 0 };
    }
    const reviews = await review_model_1.Review.aggregate([
        {
            $match: {
                service: { $in: serviceIds },
                status: 'approved',
            },
        },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
            },
        },
    ]);
    return {
        averageRating: ((_a = reviews[0]) === null || _a === void 0 ? void 0 : _a.averageRating)
            ? Math.round(reviews[0].averageRating * 10) / 10
            : 0,
        totalReviews: ((_b = reviews[0]) === null || _b === void 0 ? void 0 : _b.totalReviews) || 0,
    };
};
// Get provider summary stats (Total Services, Scheduled, Completed, Earnings)
const getProviderSummaryStats = async (providerId) => {
    var _a;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Get all stats in parallel
    const [totalServices, scheduledServices, completedServices, earnings] = await Promise.all([
        // Total Services (all bookings assigned to this provider, excluding cancelled)
        booking_model_1.Booking.countDocuments({
            staff: providerId,
            status: { $nin: ['cancelled'] },
        }),
        // Scheduled Services (upcoming bookings)
        booking_model_1.Booking.countDocuments({
            staff: providerId,
            date: { $gte: today },
            status: { $in: ['confirmed', 'scheduled', 'requested'] },
        }),
        // Completed Services
        booking_model_1.Booking.countDocuments({
            staff: providerId,
            status: 'completed',
        }),
        // Total Earnings (from all non-cancelled bookings)
        booking_model_1.Booking.aggregate([
            {
                $match: {
                    staff: providerId,
                    status: { $nin: ['cancelled'] },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$price' },
                },
            },
        ]),
    ]);
    return {
        totalServices,
        scheduledServices,
        completedServices,
        earnings: ((_a = earnings[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
    };
};
const getRecentServices = async () => {
    const bookings = await booking_model_1.Booking.find({
        status: { $nin: ['cancelled', 'draft'] },
    })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name profile')
        .populate('staff', 'name profile')
        .select('user staff serviceType.title status date price');
    return bookings.map(booking => {
        var _a, _b, _c, _d;
        return ({
            _id: booking._id.toString(),
            user: {
                _id: (_a = booking.user) === null || _a === void 0 ? void 0 : _a._id,
                name: ((_b = booking.user) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown User',
                profile: (_c = booking.user) === null || _c === void 0 ? void 0 : _c.profile,
            },
            staff: booking.staff
                ? {
                    _id: booking.staff._id,
                    name: booking.staff.name,
                    profile: booking.staff.profile,
                }
                : {
                    _id: '',
                    name: 'Unassigned',
                },
            service: ((_d = booking.serviceType) === null || _d === void 0 ? void 0 : _d.title) || 'Unknown Service',
            status: booking.status,
            date: booking.date,
            price: booking.price,
        });
    });
};
const getStaffRecentServices = async (staffId, status) => {
    const query = { staff: staffId };
    if (status) {
        query.status = status;
    }
    else {
        query.status = { $nin: ['cancelled', 'draft'] };
    }
    const bookings = await booking_model_1.Booking.find(query)
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('user', 'name profile')
        .select('user serviceType.title status date price');
    return bookings.map(booking => {
        var _a, _b, _c, _d;
        return ({
            _id: booking._id.toString(),
            user: {
                _id: (_a = booking.user) === null || _a === void 0 ? void 0 : _a._id,
                name: ((_b = booking.user) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown User',
                profile: (_c = booking.user) === null || _c === void 0 ? void 0 : _c.profile,
            },
            staff: {
                _id: staffId,
                name: '', // We don't need staff name here as it's for the logged-in staff
            },
            service: ((_d = booking.serviceType) === null || _d === void 0 ? void 0 : _d.title) || 'Unknown Service',
            status: booking.status,
            date: booking.date,
            price: booking.price,
        });
    });
};
exports.StatsServices = {
    getDashboardData,
    getServiceRequests,
    getRevenueTrend,
    getClientStats,
    getStaffStats,
    getServiceStats,
    getPaymentStatsClean,
    getReviewSupportStatsSimple,
    getProviderDashboard,
    getProviderSummaryStats,
    getRecentServices,
    getStaffRecentServices,
};
