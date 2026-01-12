"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsRoutes = void 0;
const express_1 = __importDefault(require("express"));
const stats_controller_1 = require("./stats.controller");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const router = express_1.default.Router();
// GET /api/stats/dashboard - Complete dashboard data
router.get('/admin/dashboard', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), stats_controller_1.StatsController.getDashboard);
// GET /api/stats/service-requests - Service requests for chart
router.get('/admin/service-requests', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), stats_controller_1.StatsController.getServiceRequests);
// GET /api/stats/revenue-trend - Revenue trend for chart
router.get('/admin/revenue-trend', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), stats_controller_1.StatsController.getRevenueTrend);
// GET /api/stats/client-stats - Client stats
router.get('/admin/client-stats', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), stats_controller_1.StatsController.getClientStats);
// GET /api/stats/staff-stats - Staff stats
router.get('/admin/staff-stats', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), stats_controller_1.StatsController.getStaffStats);
// GET /api/stats/service-stats - Service stats
router.get('/admin/service-stats', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), stats_controller_1.StatsController.getServiceStats);
// GET /api/stats/payment-stats - Payment stats
router.get('/admin/payment-stats', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), stats_controller_1.StatsController.getPaymentStatsClean);
// GET /api/stats/recent-services - Recent services for admin dashboard
router.get('/admin/recent-services', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), stats_controller_1.StatsController.getRecentServices);
// GET /api/stats/review-support-stats - Review and support stats
router.get('/admin/review-support-stats', stats_controller_1.StatsController.getReviewSupportStatsSimple);
// GET /api/stats/provider-dashboard - Provider dashboard data
router.get('/provider/dashboard', (0, auth_1.default)(user_1.USER_ROLES.STAFF), stats_controller_1.StatsController.getProviderDashboard);
// GET /api/stats/provider-summary - Provider summary stats
router.get('/provider/my-summary', (0, auth_1.default)(user_1.USER_ROLES.STAFF), stats_controller_1.StatsController.getProviderSummaryStats);
// GET /api/stats/staff/recent-services - `Staff recent services`
router.get('/provider/recent-services', (0, auth_1.default)(user_1.USER_ROLES.STAFF), stats_controller_1.StatsController.getStaffRecentServices);
exports.StatsRoutes = router;
