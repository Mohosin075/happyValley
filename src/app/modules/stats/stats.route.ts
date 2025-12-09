import express from 'express'
import { StatsController } from './stats.controller'

const router = express.Router()

// GET /api/stats/dashboard - Complete dashboard data
router.get('/dashboard', StatsController.getDashboard)

// GET /api/stats/service-requests - Service requests for chart
router.get('/service-requests', StatsController.getServiceRequests)

// GET /api/stats/revenue-trend - Revenue trend for chart
router.get('/revenue-trend', StatsController.getRevenueTrend)

// GET /api/stats/client-stats - Client stats
router.get('/client-stats', StatsController.getClientStats)

// GET /api/stats/staff-stats - Staff stats
router.get('/staff-stats', StatsController.getStaffStats)

// GET /api/stats/service-stats - Service stats
router.get('/service-stats', StatsController.getServiceStats)

// GET /api/stats/payment-stats - Payment stats
router.get('/payment-stats', StatsController.getPaymentStatsClean)

// GET /api/stats/review-support-stats - Review and support stats
router.get('/review-support-stats', StatsController.getReviewSupportStatsSimple)

export const StatsRoutes = router
