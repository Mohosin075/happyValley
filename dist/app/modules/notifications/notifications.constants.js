"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookingNotificationType = exports.getBookingNotificationTitle = exports.NOTIFICATION_MESSAGES = exports.NOTIFICATION_TITLES = exports.NOTIFICATION_TYPES = void 0;
var NOTIFICATION_TYPES;
(function (NOTIFICATION_TYPES) {
    NOTIFICATION_TYPES["BOOKING_CONFIRMED"] = "BOOKING_CONFIRMED";
    NOTIFICATION_TYPES["BOOKING_IN_PROGRESS"] = "BOOKING_IN_PROGRESS";
    NOTIFICATION_TYPES["BOOKING_COMPLETED"] = "BOOKING_COMPLETED";
    NOTIFICATION_TYPES["BOOKING_CANCELLED"] = "BOOKING_CANCELLED";
    NOTIFICATION_TYPES["BOOKING_REQUESTED"] = "BOOKING_REQUESTED";
    NOTIFICATION_TYPES["BOOKING_SCHEDULED"] = "BOOKING_SCHEDULED";
    NOTIFICATION_TYPES["PAYMENT_RECEIVED"] = "PAYMENT_RECEIVED";
    NOTIFICATION_TYPES["SUBSCRIPTION_ACTIVATED"] = "SUBSCRIPTION_ACTIVATED";
    NOTIFICATION_TYPES["SUBSCRIPTION_RENEWED"] = "SUBSCRIPTION_RENEWED";
    NOTIFICATION_TYPES["SUBSCRIPTION_EXPIRED"] = "SUBSCRIPTION_EXPIRED";
    NOTIFICATION_TYPES["SYSTEM"] = "SYSTEM";
    NOTIFICATION_TYPES["ADMIN"] = "ADMIN";
})(NOTIFICATION_TYPES || (exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES = {}));
exports.NOTIFICATION_TITLES = {
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
};
exports.NOTIFICATION_MESSAGES = {
    BOOKING_STATUS_CHANGED: (status) => `Your booking status has been updated to ${status}.`,
    PAYMENT_CONFIRMED: (type, amount) => `Your payment of $${amount} for ${type.replace('_', ' ')} has been received successfully.`,
    SUBSCRIPTION_SUCCESS: (planName) => `Your subscription to the ${planName} plan is now active!`,
    SUBSCRIPTION_RENEWAL: (planName) => `Your subscription to the ${planName} plan has been renewed successfully.`,
    SUBSCRIPTION_FAILED: `Your subscription payment failed. Please update your payment method to avoid service interruption.`,
};
const getBookingNotificationTitle = (status) => {
    switch (status) {
        case 'confirmed':
            return exports.NOTIFICATION_TITLES.BOOKING_CONFIRMED;
        case 'inProgress':
            return exports.NOTIFICATION_TITLES.BOOKING_IN_PROGRESS;
        case 'completed':
            return exports.NOTIFICATION_TITLES.BOOKING_COMPLETED;
        case 'cancelled':
            return exports.NOTIFICATION_TITLES.BOOKING_CANCELLED;
        case 'requested':
            return exports.NOTIFICATION_TITLES.BOOKING_REQUESTED;
        case 'scheduled':
            return exports.NOTIFICATION_TITLES.BOOKING_SCHEDULED;
        default:
            return exports.NOTIFICATION_TITLES.BOOKING_UPDATED;
    }
};
exports.getBookingNotificationTitle = getBookingNotificationTitle;
const getBookingNotificationType = (status) => {
    switch (status) {
        case 'confirmed':
            return NOTIFICATION_TYPES.BOOKING_CONFIRMED;
        case 'inProgress':
            return NOTIFICATION_TYPES.BOOKING_IN_PROGRESS;
        case 'completed':
            return NOTIFICATION_TYPES.BOOKING_COMPLETED;
        case 'cancelled':
            return NOTIFICATION_TYPES.BOOKING_CANCELLED;
        case 'requested':
            return NOTIFICATION_TYPES.BOOKING_REQUESTED;
        case 'scheduled':
            return NOTIFICATION_TYPES.BOOKING_SCHEDULED;
        default:
            return NOTIFICATION_TYPES.SYSTEM;
    }
};
exports.getBookingNotificationType = getBookingNotificationType;
