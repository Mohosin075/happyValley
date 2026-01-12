"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsController = void 0;
const stats_service_1 = require("./stats.service");
const getDashboard = async (req, res) => {
    try {
        const data = await stats_service_1.StatsServices.getDashboardData();
        res.status(200).json({
            success: true,
            message: 'Dashboard data fetched successfully',
            data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
const getServiceRequests = async (req, res) => {
    try {
        const months = parseInt(req.query.months) || 6;
        const data = await stats_service_1.StatsServices.getServiceRequests(months);
        res.status(200).json({
            success: true,
            message: 'Service requests data fetched successfully',
            data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching service requests data',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
const getRevenueTrend = async (req, res) => {
    try {
        const months = parseInt(req.query.months) || 6;
        const data = await stats_service_1.StatsServices.getRevenueTrend(months);
        res.status(200).json({
            success: true,
            message: 'Revenue trend data fetched successfully',
            data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching revenue trend data',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
const getClientStats = async (req, res) => {
    try {
        const data = await stats_service_1.StatsServices.getClientStats();
        res.status(200).json({
            success: true,
            message: 'Client stats data fetched successfully',
            data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching client stats data',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
const getStaffStats = async (req, res) => {
    try {
        const data = await stats_service_1.StatsServices.getStaffStats();
        res.status(200).json({
            success: true,
            message: 'Staff stats data fetched successfully',
            data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching staff stats data',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
const getServiceStats = async (req, res) => {
    try {
        const data = await stats_service_1.StatsServices.getServiceStats();
        res.status(200).json({
            success: true,
            message: 'Service stats data fetched successfully',
            data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching service stats data',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
const getPaymentStatsClean = async (req, res) => {
    try {
        const data = await stats_service_1.StatsServices.getPaymentStatsClean();
        res.status(200).json({
            success: true,
            message: 'Payment stats data fetched successfully',
            data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching payment stats data',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
const getReviewSupportStatsSimple = async (req, res) => {
    try {
        const data = await stats_service_1.StatsServices.getReviewSupportStatsSimple();
        res.status(200).json({
            success: true,
            message: 'Review support stats data fetched successfully',
            data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching review support stats data',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
const getProviderDashboard = async (req, res) => {
    try {
        const providerId = req.user.authId;
        const data = await stats_service_1.StatsServices.getProviderDashboard(providerId);
        res.status(200).json({
            success: true,
            message: 'Provider dashboard data fetched successfully',
            data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching provider dashboard data',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
const getProviderSummaryStats = async (req, res) => {
    try {
        const providerId = req.user.authId;
        const data = await stats_service_1.StatsServices.getProviderSummaryStats(providerId);
        res.status(200).json({
            success: true,
            message: 'Provider summary stats data fetched successfully',
            data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching provider summary stats data',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
const getRecentServices = async (req, res) => {
    try {
        const data = await stats_service_1.StatsServices.getRecentServices();
        res.status(200).json({
            success: true,
            message: 'Recent services fetched successfully',
            data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching recent services',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
const getStaffRecentServices = async (req, res) => {
    try {
        const providerId = req.user.authId;
        const status = req.query.status;
        const data = await stats_service_1.StatsServices.getStaffRecentServices(providerId, status);
        res.status(200).json({
            success: true,
            message: 'Staff recent services fetched successfully',
            data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching staff recent services',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.StatsController = {
    getDashboard,
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
