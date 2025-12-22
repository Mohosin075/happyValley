export enum NOTIFICATION_TYPES {
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_IN_PROGRESS = 'BOOKING_IN_PROGRESS',
  BOOKING_COMPLETED = 'BOOKING_COMPLETED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_REQUESTED = 'BOOKING_REQUESTED',
  BOOKING_SCHEDULED = 'BOOKING_SCHEDULED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  SUBSCRIPTION_ACTIVATED = 'SUBSCRIPTION_ACTIVATED',
  SUBSCRIPTION_RENEWED = 'SUBSCRIPTION_RENEWED',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  SYSTEM = 'SYSTEM',
  ADMIN = 'ADMIN',
}

export const NOTIFICATION_TITLES = {
  BOOKING_UPDATED: 'Booking Update',
  BOOKING_CONFIRMED: 'Booking Confirmed!',
  BOOKING_IN_PROGRESS: 'Booking In Progress',
  BOOKING_COMPLETED: 'Booking Completed',
  BOOKING_CANCELLED: 'Booking Cancelled',
  BOOKING_REQUESTED: 'Booking Requested',
  BOOKING_SCHEDULED: 'Booking Scheduled',
  PAYMENT_RECEIVED: 'Payment Received',
  SUBSCRIPTION_ACTIVATED: 'Subscription Activated',
  SUBSCRIPTION_RENEWED: 'Subscription Renewed',
  SUBSCRIPTION_EXPIRED: 'Subscription Expired',
}

export const NOTIFICATION_MESSAGES = {
  BOOKING_STATUS_CHANGED: (status: string) =>
    `Your booking status has been updated to ${status}.`,
  PAYMENT_CONFIRMED: (type: string, amount: number) =>
    `Your payment of $${amount} for ${type.replace('_', ' ')} has been received successfully.`,
  SUBSCRIPTION_SUCCESS: (planName: string) =>
    `Your subscription to the ${planName} plan is now active!`,
  SUBSCRIPTION_RENEWAL: (planName: string) =>
    `Your subscription to the ${planName} plan has been renewed successfully.`,
  SUBSCRIPTION_FAILED:
    `Your subscription payment failed. Please update your payment method to avoid service interruption.`,
}

export const getBookingNotificationTitle = (status: string) => {
  switch (status) {
    case 'confirmed':
      return NOTIFICATION_TITLES.BOOKING_CONFIRMED
    case 'inProgress':
      return NOTIFICATION_TITLES.BOOKING_IN_PROGRESS
    case 'completed':
      return NOTIFICATION_TITLES.BOOKING_COMPLETED
    case 'cancelled':
      return NOTIFICATION_TITLES.BOOKING_CANCELLED
    case 'requested':
      return NOTIFICATION_TITLES.BOOKING_REQUESTED
    case 'scheduled':
      return NOTIFICATION_TITLES.BOOKING_SCHEDULED
    default:
      return NOTIFICATION_TITLES.BOOKING_UPDATED
  }
}

export const getBookingNotificationType = (status: string): NOTIFICATION_TYPES => {
  switch (status) {
    case 'confirmed':
      return NOTIFICATION_TYPES.BOOKING_CONFIRMED
    case 'inProgress':
      return NOTIFICATION_TYPES.BOOKING_IN_PROGRESS
    case 'completed':
      return NOTIFICATION_TYPES.BOOKING_COMPLETED
    case 'cancelled':
      return NOTIFICATION_TYPES.BOOKING_CANCELLED
    case 'requested':
      return NOTIFICATION_TYPES.BOOKING_REQUESTED
    case 'scheduled':
      return NOTIFICATION_TYPES.BOOKING_SCHEDULED
    default:
      return NOTIFICATION_TYPES.SYSTEM
  }
}
