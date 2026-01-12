"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingRoutes = void 0;
const express_1 = __importDefault(require("express"));
const booking_controller_1 = require("./booking.controller");
const booking_validation_1 = require("./booking.validation");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const gorceryChat_1 = require("./gorceryChat");
const subscriptionGuard_1 = __importDefault(require("../../middleware/subscriptionGuard"));
const router = express_1.default.Router();
// Base route: /bookings
router
    .route('/')
    .get((0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.CLIENT, user_1.USER_ROLES.STAFF), booking_controller_1.BookingController.getAllBookings)
    .post((0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.CLIENT), (0, validateRequest_1.default)(booking_validation_1.BookingValidations.create), booking_controller_1.BookingController.createBooking);
// My services route: /bookings/my-services
router
    .route('/my-services')
    .get((0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.CLIENT, user_1.USER_ROLES.STAFF), subscriptionGuard_1.default, booking_controller_1.BookingController.myServices);
// Track upcoming bookings route: /bookings/my-upcoming
router
    .route('/my-upcoming')
    .get((0, auth_1.default)(user_1.USER_ROLES.STAFF), booking_controller_1.BookingController.getUpcomingBookings);
// Scheduled bookings route: /bookings/scheduled
router
    .route('/scheduled')
    .get((0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.CLIENT, user_1.USER_ROLES.STAFF), booking_controller_1.BookingController.getBookingsByDate);
// Update booking status route: /bookings/:id/status
router
    .route('/:id/status')
    .patch((0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.STAFF), (0, validateRequest_1.default)(booking_validation_1.BookingValidations.updateBookingStatus), booking_controller_1.BookingController.updateBookingStatus);
router
    .route('/:id/add-price')
    .patch((0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(booking_validation_1.BookingValidations.updatePrice), booking_controller_1.BookingController.updatePrice);
router
    .route('/:id/update-fees')
    .patch((0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(booking_validation_1.BookingValidations.updateFees), booking_controller_1.BookingController.updateBookingFees);
router
    .route('/weekly')
    .get((0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), booking_controller_1.BookingController.getWeeklyBookingsByUser);
// Single booking routes: /bookings/:id
router
    .route('/:id')
    .get((0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.CLIENT, user_1.USER_ROLES.STAFF), booking_controller_1.BookingController.getSingleBooking)
    .patch((0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(booking_validation_1.BookingValidations.update), booking_controller_1.BookingController.updateBooking)
    .delete((0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), booking_controller_1.BookingController.deleteBooking);
// ====================================
// Kitchen Restock AI Chatbot Routes
// ====================================
router.post('/chat/send', (0, auth_1.default)(user_1.USER_ROLES.CLIENT, user_1.USER_ROLES.ADMIN), gorceryChat_1.sendMessageToGroceryBot);
router.post('/chat/confirm', (0, auth_1.default)(user_1.USER_ROLES.CLIENT, user_1.USER_ROLES.ADMIN), gorceryChat_1.confirmGroceryOrder);
router.get('/chat/past-orders', (0, auth_1.default)(user_1.USER_ROLES.CLIENT, user_1.USER_ROLES.ADMIN), gorceryChat_1.getPastOrders);
router.get('/chat/active-session', (0, auth_1.default)(user_1.USER_ROLES.CLIENT, user_1.USER_ROLES.ADMIN), gorceryChat_1.getActiveSession);
router.get('/chat/session/:sessionId', (0, auth_1.default)(user_1.USER_ROLES.CLIENT, user_1.USER_ROLES.ADMIN), gorceryChat_1.getSingleGrocerySession);
router.post('/chat/items', (0, auth_1.default)(user_1.USER_ROLES.CLIENT, user_1.USER_ROLES.ADMIN), gorceryChat_1.addManualItems);
router.delete('/chat/items', (0, auth_1.default)(user_1.USER_ROLES.CLIENT, user_1.USER_ROLES.ADMIN), gorceryChat_1.removeItemFromGrocerySession);
router.post('/chat/reuse', (0, auth_1.default)(user_1.USER_ROLES.CLIENT, user_1.USER_ROLES.ADMIN), gorceryChat_1.reuseFromPastOrder);
exports.BookingRoutes = router;
