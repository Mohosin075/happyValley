import { Request, Response } from 'express'
import { StatsServices } from './stats.service'
import { JwtPayload } from 'jsonwebtoken'

const getDashboard = async (req: Request, res: Response) => {
  try {
    const data = await StatsServices.getDashboardData()
    res.status(200).json({
      success: true,
      message: 'Dashboard data fetched successfully',
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const getServiceRequests = async (req: Request, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 6
    const data = await StatsServices.getServiceRequests(months)

    res.status(200).json({
      success: true,
      message: 'Service requests data fetched successfully',
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching service requests data',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const getRevenueTrend = async (req: Request, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 6
    const data = await StatsServices.getRevenueTrend(months)

    res.status(200).json({
      success: true,
      message: 'Revenue trend data fetched successfully',
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue trend data',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const getClientStats = async (req: Request, res: Response) => {
  try {
    const data = await StatsServices.getClientStats()

    res.status(200).json({
      success: true,
      message: 'Client stats data fetched successfully',
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching client stats data',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const getStaffStats = async (req: Request, res: Response) => {
  try {
    const data = await StatsServices.getStaffStats()

    res.status(200).json({
      success: true,
      message: 'Staff stats data fetched successfully',
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching staff stats data',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const getServiceStats = async (req: Request, res: Response) => {
  try {
    const data = await StatsServices.getServiceStats()

    res.status(200).json({
      success: true,
      message: 'Service stats data fetched successfully',
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching service stats data',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const getPaymentStatsClean = async (req: Request, res: Response) => {
  try {
    const data = await StatsServices.getPaymentStatsClean()

    res.status(200).json({
      success: true,
      message: 'Payment stats data fetched successfully',
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment stats data',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const getReviewSupportStatsSimple = async (req: Request, res: Response) => {
  try {
    const data = await StatsServices.getReviewSupportStatsSimple()

    res.status(200).json({
      success: true,
      message: 'Review support stats data fetched successfully',
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching review support stats data',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const getProviderDashboard = async (req: Request, res: Response) => {
  try {
    const providerId = (req.user as JwtPayload).authId
    const data = await StatsServices.getProviderDashboard(providerId)

    res.status(200).json({
      success: true,
      message: 'Provider dashboard data fetched successfully',
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching provider dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const getProviderSummaryStats = async (req: Request, res: Response) => {
  try {
    const providerId = (req.user as JwtPayload).authId
    const data = await StatsServices.getProviderSummaryStats(providerId)

    res.status(200).json({
      success: true,
      message: 'Provider summary stats data fetched successfully',
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching provider summary stats data',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const getRecentServices = async (req: Request, res: Response) => {
  try {
    const data = await StatsServices.getRecentServices()

    res.status(200).json({
      success: true,
      message: 'Recent services fetched successfully',
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent services',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const getStaffRecentServices = async (req: Request, res: Response) => {
  try {
    const providerId = (req.user as JwtPayload).authId
    const status = req.query.status as string
    const data = await StatsServices.getStaffRecentServices(providerId, status)

    res.status(200).json({
      success: true,
      message: 'Staff recent services fetched successfully',
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching staff recent services',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}


export const StatsController = {
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
}
