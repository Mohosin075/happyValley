import express from 'express'
import { StatsController } from './stats.controller'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'

const router = express.Router()

// GET /api/stats/dashboard - Complete dashboard data
router.get('/admin/dashboard', StatsController.getDashboard)

// GET /api/stats/service-requests - Service requests for chart
router.get('/admin/service-requests', StatsController.getServiceRequests)

// GET /api/stats/revenue-trend - Revenue trend for chart
router.get('/admin/revenue-trend', StatsController.getRevenueTrend)

// GET /api/stats/client-stats - Client stats
router.get('/admin/client-stats', StatsController.getClientStats)

// GET /api/stats/staff-stats - Staff stats
router.get('/admin/staff-stats', StatsController.getStaffStats)

// GET /api/stats/service-stats - Service stats
router.get('/admin/service-stats', StatsController.getServiceStats)

// GET /api/stats/payment-stats - Payment stats
router.get('/admin/payment-stats', StatsController.getPaymentStatsClean)

// GET /api/stats/review-support-stats - Review and support stats
router.get(
  '/admin/review-support-stats',
  StatsController.getReviewSupportStatsSimple,
)

// GET /api/stats/provider-dashboard - Provider dashboard data
router.get(
  '/provider/dashboard',
  auth(USER_ROLES.STAFF),
  StatsController.getProviderDashboard,
)

// GET /api/stats/provider-summary - Provider summary stats
router.get(
  '/provider/my-summary',
  auth(USER_ROLES.STAFF),
  StatsController.getProviderSummaryStats,
)

export const StatsRoutes = router
