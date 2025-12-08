import { Booking } from '../booking/booking.model'

const getDashboardData = async () => {
  const now = new Date()
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [
    totalClients,
    activeServices,
    totalRevenue,
    activeStaff,
    monthlyBookings,
    monthlyRevenue,
  ] = await Promise.all([
    // Total Clients
    Booking.distinct('user').countDocuments(),

    // Active Services (last month)
    Booking.distinct('service', {
      createdAt: { $gte: startOfLastMonth },
    }).countDocuments(),

    // Total Revenue
    Booking.aggregate([{ $group: { _id: null, total: { $sum: '$price' } } }]),

    // Active Staff
    Booking.distinct('staff', {
      createdAt: { $gte: startOfLastMonth },
    }).countDocuments(),

    // Monthly bookings
    Booking.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Monthly revenue
    Booking.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$price' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ])

  return {
    totalClients,
    activeServices,
    totalRevenue: totalRevenue[0]?.total || 0,
    activeStaff,
    monthlyBookings,
    monthlyRevenue,
  }
}

export const StatsService = {
  getDashboardData,
}
