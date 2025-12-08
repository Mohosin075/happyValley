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
