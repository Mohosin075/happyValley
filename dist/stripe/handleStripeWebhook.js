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
const stripe_1 = __importDefault(require("../config/stripe"));
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const handleStripeWebhook = async (req, res) => {
    // Extract Stripe signature and webhook secret
    const signature = req.headers['stripe-signature'];
    const webhookSecret = config_1.default.stripe.webhookSecret;
    let event;
    // Verify the event signature
    try {
        event = stripe_1.default.webhooks.constructEvent(req.body, signature, webhookSecret);
    }
    catch (error) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Webhook signature verification failed. ${error}`);
    }
    // Check if the event is valid
    if (!event) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid event received!');
    }
    // Extract event data and type
    const data = event.data.object;
    const eventType = event.type;
    // Handle the event based on its type
    //   console.log(colors.bgGreen.bold(`Event Type: ${eventType}`))
    try {
        switch (eventType) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await (0, handleSubscriptionCreated_1.handleSubscriptionCreated)(data);
                break;
            default:
                logger_1.logger.warn(colors_1.default.bgGreen.bold(`Unhandled event type: ${eventType}`));
        }
    }
    catch (error) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error handling event: ${error}`);
    }
    res.sendStatus(200);
};
exports.default = handleStripeWebhook;
