"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const payment_controller_1 = require("./payment.controller");
const router = express_1.default.Router();
router.post('/invoice-checkout/:invoiceId', (0, auth_1.default)(user_1.USER_ROLES.CLIENT, user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), payment_controller_1.PaymentController.createInvoiceSession);
router.post('/pay-booking-fee/:bookingId', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.STAFF, user_1.USER_ROLES.CLIENT), payment_controller_1.PaymentController.createBookingFeeSession);
router.post('/pay-service-charge/:bookingId', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.STAFF, user_1.USER_ROLES.CLIENT, user_1.USER_ROLES.SUPER_ADMIN), payment_controller_1.PaymentController.createServiceChargeSession);
router.get('/export', 
// auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
payment_controller_1.PaymentController.exportPayments);
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.CLIENT), payment_controller_1.PaymentController.getAllPayments);
exports.PaymentRoutes = router;
