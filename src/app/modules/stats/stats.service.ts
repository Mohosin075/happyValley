import { USER_ROLES } from '../../../enum/user'
import { Booking } from '../booking/booking.model'
import { Review } from '../review/review.model'
import { Service } from '../service/service.model'
import { Subscription } from '../subscription/subscription.model'
import { Support } from '../support/support.model'
import { User } from '../user/user.model'
import {
  IPaymentStats,
  IProviderDashboard,
  IRecentService,
  IServiceStats,
  IStaffStats,
} from './stats.interface'

// Helper function to get month name
const getMonthName = (monthIndex: number): string => {
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
  ]
  return months[monthIndex]
}

// Helper function to ensure all months are included
const fillMissingMonths = (
  data: Array<{ month: string; count?: number; revenue?: number }>,
  months: number = 6,
) => {
  const result = []
  const endDate = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date()
    date.setMonth(endDate.getMonth() - i)
    const monthName = getMonthName(date.getMonth())

    const existingData = data.find(item => item.month === monthName)

    if (existingData) {
      result.push(existingData)
    } else {
      // Push zero values for missing months
      if ('count' in data[0]) {
        result.push({ month: monthName, count: 0 })
      } else if ('revenue' in data[0]) {
        result.push({ month: monthName, revenue: 0 })
      }
    }
  }

  return result
}

// 1. Service Requests - Monthly service bookings over time
const getServiceRequests = async (months: number = 6) => {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)
  startDate.setDate(1)
  startDate.setHours(0, 0, 0, 0)

  const serviceRequests = await Booking.aggregate([
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
  ])

  // Fill in missing months with zero values
  const filledData = fillMissingMonths(
    serviceRequests.map(item => ({
      month: item.month,
      count: item.count,
    })),
    months,
  )

  return filledData
}

// 2. Revenue Trend - Monthly revenue over time
const getRevenueTrend = async (months: number = 6) => {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)
  startDate.setDate(1)
  startDate.setHours(0, 0, 0, 0)

  const revenueTrend = await Booking.aggregate([
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
  ])

  // Fill in missing months with zero values
  const filledData = fillMissingMonths(
    revenueTrend.map(item => ({
      month: item.month,
      revenue: item.revenue,
    })),
    months,
  )

  return filledData
}

// 3. Complete Dashboard Data (combines all)
const getDashboardData = async () => {
  const now = new Date()
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999,
  )

  // Get last 6 months of data for charts
  const [
    totalClients,
    activeServices,
    totalRevenue,
    activeStaff,
    serviceRequests,
    revenueTrend,
  ] = await Promise.all([
    // Total Clients (all time)
    Booking.distinct('user').countDocuments(),

    // Active Services (last month - distinct services booked)
    Booking.distinct('service', {
      createdAt: {
        $gte: startOfLastMonth,
        $lte: endOfLastMonth,
      },
      status: { $nin: ['cancelled'] },
    }).countDocuments(),

    // Total Revenue (all time)
    Booking.aggregate([
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
    Booking.distinct('staff', {
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
  ])

  return {
    totalClients,
    activeServices,
    totalRevenue: totalRevenue[0]?.total || 0,
    activeStaff,
    serviceRequests,
    revenueTrend,
  }
}

interface IClientStats {
  totalClients: number
  premiumMembers: number
  activeThisMonth: number
  newThisMonth: number
  growthRate: number
  premiumPercentage: number
}

// Get client statistics
const getClientStats = async (): Promise<IClientStats> => {
  const now = new Date()
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999,
  )

  // Get all stats in parallel for better performance
  const [
    totalClients,
    premiumMembers,
    activeThisMonth,
    newThisMonth,
    lastMonthClients,
  ] = await Promise.all([
    // Total Clients (users with role = CLIENT)
    User.countDocuments({ role: USER_ROLES.CLIENT }),

    // Premium Members (users with active subscription)
    User.countDocuments({
      role: USER_ROLES.CLIENT,
      _id: {
        $in: await Subscription.distinct('user', {
          status: 'active',
          currentPeriodEnd: { $gte: new Date().toISOString() },
        }),
      },
    }),

    // Active This Month (clients who booked this month)
    User.countDocuments({
      role: USER_ROLES.CLIENT,
      _id: {
        $in: await Booking.distinct('user', {
          createdAt: { $gte: startOfCurrentMonth },
          status: { $nin: ['cancelled'] },
        }),
      },
    }),

    // New This Month (clients created this month)
    User.countDocuments({
      role: USER_ROLES.CLIENT,
      createdAt: { $gte: startOfCurrentMonth },
    }),

    // Last month total for growth calculation
    User.countDocuments({
      role: USER_ROLES.CLIENT,
      createdAt: { $lt: startOfCurrentMonth },
    }),
  ])

  // Calculate growth rate
  const growthRate =
    lastMonthClients > 0
      ? ((totalClients - lastMonthClients) / lastMonthClients) * 100
      : totalClients > 0
        ? 100
        : 0

  // Calculate premium percentage
  const premiumPercentage =
    totalClients > 0 ? (premiumMembers / totalClients) * 100 : 0

  return {
    totalClients,
    premiumMembers,
    activeThisMonth,
    newThisMonth,
    growthRate: Math.round(growthRate * 10) / 10, // Round to 1 decimal
    premiumPercentage: Math.round(premiumPercentage * 10) / 10,
  }
}

// Get staff statistics
const getStaffStats = async (): Promise<IStaffStats> => {
  const now = new Date()
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  )
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Get total staff count
  const totalStaff = await User.countDocuments({ role: USER_ROLES.STAFF })

  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      activeToday: 0,
      averageRating: 0,
      servicesThisMonth: 0,
      availableStaff: 0,
      occupiedStaff: 0,
    }
  }

  // Get staff who are active today (have bookings today)
  const activeStaffToday = await Booking.distinct('staff', {
    date: { $gte: startOfToday },
    status: { $nin: ['cancelled'] },
  })

  // Get services created by staff this month
  const servicesThisMonth = await Service.countDocuments({
    createdAt: { $gte: startOfCurrentMonth },
  })

  // Calculate average rating for staff
  const averageRating = await calculateAverageStaffRating()

  // Get available vs occupied staff for today
  const todayBookings = await Booking.find({
    date: { $gte: startOfToday },
    status: { $nin: ['cancelled'] },
  }).select('staff')

  const occupiedStaffIds = [
    ...new Set(todayBookings.map(booking => booking.staff.toString())),
  ]
  const availableStaff = totalStaff - occupiedStaffIds.length

  return {
    totalStaff,
    activeToday: activeStaffToday.length,
    averageRating,
    servicesThisMonth,
    availableStaff,
    occupiedStaff: occupiedStaffIds.length,
  }
}

// Calculate average rating for all staff
const calculateAverageStaffRating = async (): Promise<number> => {
  // Get all services created by staff
  const services = await Service.find({}).select('_id createdBy')

  // Create a map of service IDs to their creator (staff)
  const serviceToStaffMap = new Map()
  services.forEach(service => {
    if (service.createdBy) {
      serviceToStaffMap.set(
        service._id.toString(),
        service.createdBy.toString(),
      )
    }
  })

  // Get all reviews for these services
  const reviews = await Review.find({
    service: { $in: Array.from(serviceToStaffMap.keys()) },
    status: 'approved',
  })

  if (reviews.length === 0) return 0

  // Group ratings by staff
  const staffRatings = new Map<string, { total: number; count: number }>()

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
  let totalRating = 0
  let totalReviews = 0

  staffRatings.forEach(value => {
    totalRating += value.total
    totalReviews += value.count
  })

  const average = totalReviews > 0 ? totalRating / totalReviews : 0
  return Math.round(average * 10) / 10 // Round to 1 decimal
}

// Get service statistics
const getServiceStats = async (): Promise<IServiceStats> => {
  const now = new Date()
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999,
  )

  // Get all stats in parallel
  const [totalServices, activeServices, totalBookings, averagePrice] =
    await Promise.all([
      // Total Services
      Service.countDocuments(),

      // Active Services (services with bookings in last month)
      Service.countDocuments({
        _id: {
          $in: await Booking.distinct('service', {
            createdAt: { $gte: startOfLastMonth },
            status: { $nin: ['cancelled'] },
          }),
        },
      }),

      // Total Bookings (all time, excluding cancelled)
      Booking.countDocuments({ status: { $nin: ['cancelled'] } }),

      // Average Price (of all bookings)
      Booking.aggregate([
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
    ])

  return {
    totalServices,
    activeServices,
    totalBookings,
    averagePrice: averagePrice[0]?.avgPrice
      ? Math.round(averagePrice[0].avgPrice * 100) / 100
      : 0,
  }
}

// Helper function to get subscription stats
const getSubscriptionStats = async () => {
  const result = await Subscription.aggregate([
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
  ])

  return result[0] || { revenue: 0, count: 0 }
}

// Helper function to get booking stats by status
const getBookingStats = async () => {
  const result = await Booking.aggregate([
    {
      $group: {
        _id: '$status',
        revenue: { $sum: '$price' },
        count: { $sum: 1 },
      },
    },
  ])

  return result.reduce((acc, curr) => {
    acc[curr._id] = { revenue: curr.revenue, count: curr.count }
    return acc
  }, {})
}

// Main payment stats function
const getPaymentStatsClean = async (): Promise<IPaymentStats> => {
  const [subscription, bookings] = await Promise.all([
    getSubscriptionStats(),
    getBookingStats(),
  ])

  // Define status groups
  const completedStatuses = [
    'completed',
    'confirmed',
    'inProgress',
    'scheduled',
  ]
  const pendingStatuses = ['requested', 'scheduled']

  // Calculate totals
  let totalRevenue = subscription.revenue
  let totalBookings = 0
  let pendingBookings = 0
  let refundRequests = bookings.cancelled?.count || 0

  completedStatuses.forEach(status => {
    const booking = bookings[status]
    if (booking) {
      totalRevenue += booking.revenue
      totalBookings += booking.count
    }
  })

  pendingStatuses.forEach(status => {
    const booking = bookings[status]
    if (booking) {
      pendingBookings += booking.count
    }
  })

  const totalCompletedPayments = subscription.count + totalBookings
  const averageTransaction =
    totalCompletedPayments > 0 ? totalRevenue / totalCompletedPayments : 0

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    completedPayments: totalCompletedPayments,
    pendingPayments: pendingBookings,
    refundRequests: refundRequests,
    averageTransaction: Math.round(averageTransaction * 100) / 100,
    revenueGrowth: 0, // Add growth calculation separately if needed
  }
}

const getReviewSupportStatsSimple = async (): Promise<{
  averageRating: number
  pendingReviews: number
  openIssues: number
  satisfactionRate: number
}> => {
  const [reviewData, supportData] = await Promise.all([
    // Get review stats
    Review.aggregate([
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
    Support.aggregate([
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
  ])

  const avgRating = reviewData[0].averageRating[0]?.avg || 0
  const pendingReviews = reviewData[0].pendingCount[0]?.count || 0
  const approvedStats = reviewData[0].approvedRatings[0] || { avg: 0, count: 0 }
  const openIssues = supportData[0]?.count || 0

  // Calculate satisfaction rate (percentage of 4+ star average)
  const satisfactionRate =
    approvedStats.avg >= 4 ? 100 : (approvedStats.avg / 5) * 100

  return {
    averageRating: Math.round(avgRating * 10) / 10,
    pendingReviews,
    openIssues,
    satisfactionRate: Math.round(satisfactionRate * 10) / 10,
  }
}

const getProviderDashboard = async (
  providerId: string,
): Promise<IProviderDashboard> => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Calculate start of week (Monday)
  const startOfWeek = new Date(today)
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  startOfWeek.setDate(diff)
  startOfWeek.setHours(0, 0, 0, 0)

  // Get all stats in parallel
  const [
    todayServices,
    completedServices,
    totalServices,
    servicesThisWeek,
    yourRatingData,
    averageRatingData,
    totalEarnings,
    scheduledServices,
  ] = await Promise.all([
    // Today's services (bookings assigned to this provider today)
    Booking.countDocuments({
      staff: providerId,
      date: { $gte: today, $lt: tomorrow },
      status: { $nin: ['cancelled'] },
    }),

    // Completed services
    Booking.countDocuments({
      staff: providerId,
      status: 'completed',
    }),

    // Total services (all bookings assigned to this provider)
    Booking.countDocuments({
      staff: providerId,
      status: { $nin: ['cancelled'] },
    }),

    // Services this week
    Booking.countDocuments({
      staff: providerId,
      date: { $gte: startOfWeek, $lt: tomorrow },
      status: { $nin: ['cancelled'] },
    }),

    // Your rating (reviews for services provided by this staff)
    getProviderRating(providerId),

    // Average rating (average of all staff ratings)
    getAverageStaffRating(),

    // Total earnings
    Booking.aggregate([
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
    Booking.countDocuments({
      staff: providerId,
      date: { $gte: today },
      status: { $in: ['confirmed', 'scheduled', 'requested'] },
    }),
  ])

  return {
    todayServices,
    scheduledServices,
    completedServices,
    totalServices,
    servicesThisWeek, // New field added
    yourRating: yourRatingData.averageRating,
    averageRating: averageRatingData,
    totalEarnings: totalEarnings[0]?.total || 0,
  }
}

const getAverageStaffRating = async (): Promise<number> => {
  // Get all services created by staff
  const services = await Service.find({
    createdBy: { $exists: true, $ne: null },
  }).select('_id createdBy')

  const serviceToStaffMap = new Map()
  services.forEach(service => {
    serviceToStaffMap.set(service._id.toString(), service.createdBy.toString())
  })

  const reviews = await Review.find({
    service: { $in: Array.from(serviceToStaffMap.keys()) },
    status: 'approved',
  })

  if (reviews.length === 0) return 0

  const averageRating =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
  return Math.round(averageRating * 10) / 10
}

// Get provider's rating (reviews for services they provided)
const getProviderRating = async (providerId: string) => {
  // Get all services created by this provider
  const services = await Service.find({ createdBy: providerId }).select('_id')
  const serviceIds = services.map(service => service._id)

  if (serviceIds.length === 0) {
    return { averageRating: 0, totalReviews: 0 }
  }

  const reviews = await Review.aggregate([
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
  ])

  return {
    averageRating: reviews[0]?.averageRating
      ? Math.round(reviews[0].averageRating * 10) / 10
      : 0,
    totalReviews: reviews[0]?.totalReviews || 0,
  }
}

// Get provider summary stats (Total Services, Scheduled, Completed, Earnings)
const getProviderSummaryStats = async (
  providerId: string,
): Promise<{
  totalServices: number
  scheduledServices: number
  completedServices: number
  earnings: number
}> => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Get all stats in parallel
  const [totalServices, scheduledServices, completedServices, earnings] =
    await Promise.all([
      // Total Services (all bookings assigned to this provider, excluding cancelled)
      Booking.countDocuments({
        staff: providerId,
        status: { $nin: ['cancelled'] },
      }),

      // Scheduled Services (upcoming bookings)
      Booking.countDocuments({
        staff: providerId,
        date: { $gte: today },
        status: { $in: ['confirmed', 'scheduled', 'requested'] },
      }),

      // Completed Services
      Booking.countDocuments({
        staff: providerId,
        status: 'completed',
      }),

      // Total Earnings (from all non-cancelled bookings)
      Booking.aggregate([
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
    ])

  return {
    totalServices,
    scheduledServices,
    completedServices,
    earnings: earnings[0]?.total || 0,
  }
}


const getRecentServices = async (): Promise<IRecentService[]> => {
  const bookings = await Booking.find({
    status: { $nin: ['cancelled', 'draft'] },
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'name profile')
    .populate('staff', 'name profile')
    .select('user staff serviceType.title status date price')

  return bookings.map(booking => ({
    _id: booking._id.toString(),
    user: {
      _id: (booking.user as any)?._id,
      name: (booking.user as any)?.name || 'Unknown User',
      profile: (booking.user as any)?.profile,
    },
    staff: booking.staff
      ? {
        _id: (booking.staff as any)._id,
        name: (booking.staff as any).name,
        profile: (booking.staff as any).profile,
      }
      : {
        _id: '',
        name: 'Unassigned',
      },
    service: booking.serviceType?.title || 'Unknown Service',
    status: booking.status as string,
    date: booking.date,
    price: booking.price,
  }))
}

const getStaffRecentServices = async (
  staffId: string,
  status?: string,
): Promise<IRecentService[]> => {
  const query: any = { staff: staffId }

  if (status) {
    query.status = status
  } else {
    query.status = { $nin: ['cancelled', 'draft'] }
  }

  const bookings = await Booking.find(query)
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('user', 'name profile')
    .select('user serviceType.title status date price')

  return bookings.map(booking => ({
    _id: booking._id.toString(),
    user: {
      _id: (booking.user as any)?._id,
      name: (booking.user as any)?.name || 'Unknown User',
      profile: (booking.user as any)?.profile,
    },
    staff: {
      _id: staffId,
      name: '', // We don't need staff name here as it's for the logged-in staff
    },
    service: booking.serviceType?.title || 'Unknown Service',
    status: booking.status as string,
    date: booking.date,
    price: booking.price,
  }))
}


export const StatsServices = {
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
}
