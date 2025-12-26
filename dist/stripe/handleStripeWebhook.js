"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const colors_1 = __importDefault(require("colors"));
const http_status_codes_1 = require("http-status-codes");
const logger_1 = require("../shared/logger");
const config_1 = __importDefault(require("../config"));
const handleSubscriptionCreated_1 = require("./handleSubscriptionCreated");
const payment_service_1 = require("../app/modules/payment/payment.service");
const stripe_1 = __importDefault(require("../config/stripe"));
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const handleStripeWebhook = async (req, res, next) => {
    var _a;
    // Extract Stripe signature and webhook secret
    const signature = req.headers['stripe-signature'];
    const webhookSecret = config_1.default.stripe.webhookSecret;
    let event;
    // Verify the event signature
    try {
        // Log body type to debug signature issues
        // console.log('Is req.body a Buffer?', Buffer.isBuffer(req.body))
        event = stripe_1.default.webhooks.constructEvent(req.body, signature, webhookSecret);
    }
    catch (error) {
        return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Webhook signature verification failed. ${error}`));
    }
    // Check if the event is valid
    if (!event) {
        return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid event received!'));
    }
    // Extract event data and type
    const eventType = event.type;
    const data = event.data.object;
    // Handle the event based on its type
    console.log(eventType);
    try {
        switch (eventType) {
            case 'checkout.session.completed': {
                const session = data;
                if (((_a = session.metadata) === null || _a === void 0 ? void 0 : _a.type) === 'booking_payment') {
                    await payment_service_1.PaymentService.fulfillBookingPayment(session);
                }
                else {
                    await (0, handleSubscriptionCreated_1.handleCheckoutSessionCompleted)(session);
                }
                break;
            }
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await (0, handleSubscriptionCreated_1.handleSubscriptionCreated)(data);
                break;
            case 'customer.subscription.deleted':
                await (0, handleSubscriptionCreated_1.handleSubscriptionDeleted)(data);
                break;
            case 'invoice.payment_succeeded':
                await (0, handleSubscriptionCreated_1.handlePaymentSucceeded)(data);
                break;
            case 'invoice.payment_failed':
                await (0, handleSubscriptionCreated_1.handlePaymentFailed)(data);
                break;
            default:
                logger_1.logger.warn(colors_1.default.bgGreen.bold(`Unhandled event type: ${eventType}`));
        }
    }
    catch (error) {
        return next(new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error handling event: ${error}`));
    }
    res.sendStatus(200);
};
exports.default = handleStripeWebhook;
