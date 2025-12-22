export enum NOTIFICATION_TYPES {
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_IN_PROGRESS = 'BOOKING_IN_PROGRESS',
  BOOKING_COMPLETED = 'BOOKING_COMPLETED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_REQUESTED = 'BOOKING_REQUESTED',
  BOOKING_SCHEDULED = 'BOOKING_SCHEDULED',
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
}

export const NOTIFICATION_MESSAGES = {
  BOOKING_STATUS_CHANGED: (status: string) =>
    `Your booking status has been updated to ${status}.`,
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
