export interface IMonthlyData {
  month: string
  count?: number
  revenue?: number
}

export interface IDashboardData {
  totalClients: number
  activeServices: number
  totalRevenue: number
  activeStaff: number
  serviceRequests: IMonthlyData[]
  revenueTrend: IMonthlyData[]
}

// interfaces/client-stats.interface.ts
export interface IClientStats {
  totalClients: number
  premiumMembers: number
  activeThisMonth: number
  newThisMonth: number
  growthRate: number
  premiumPercentage: number
}

export interface IClientAnalytics {
  monthlyNewClients: Array<{
    month: string
    count: number
  }>
  clientDemographics: Array<{
    city: string
    count: number
  }>
  subscriptionStatus: Array<{
    status: string
    count: number
    totalRevenue: number
  }>
}

export interface ITopClient {
  userId: string
  name: string
  email: string
  profile?: string
  bookingCount: number
  totalSpent: number
  lastBooking: Date
}

export interface IClientRetention {
  returningClients: number
  retainedClients: number
  retentionRate: number
}

export interface IStaffStats {
  totalStaff: number
  activeToday: number
  averageRating: number
  servicesThisMonth: number
  availableStaff: number
  occupiedStaff: number
}

export interface IServiceStats {
  totalServices: number
  activeServices: number
  totalBookings: number
  averagePrice: number
}

export interface IPaymentStats {
  totalRevenue: number
  completedPayments: number
  pendingPayments: number
  refundRequests: number
  averageTransaction: number
  revenueGrowth: number
}

// interfaces/provider-dashboard.interface.ts
export interface IProviderDashboard {
  todayServices: number
  completedServices: number
  totalServices: number
  yourRating: number
  averageRating: number
  totalEarnings: number
  servicesThisWeek: number // New field
}

export interface IProviderMonthlyPerformance {
  month: string
  bookings: number
  revenue: number
}

export interface IProviderSchedule {
  id: string
  date: Date
  time: string
  customer: string
  phone: string
  service: string
  status: string
  address: string
  serviceType: string
}

export interface IProviderCompletionRate {
  totalBookings: number
  completedBookings: number
  completionRate: number
}

export interface IRecentService {
  _id: string
  user: {
    _id: string
    name: string
    profile?: string
  }
  staff: {
    _id: string
    name: string
    profile?: string
  }
  service: string // Service name
  status: string
  date: Date
  price: number
}
