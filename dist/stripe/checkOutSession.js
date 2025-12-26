"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutSession = void 0;
const stripe_1 = __importDefault(require("../config/stripe"));
const user_model_1 = require("../app/modules/user/user.model");
const plan_model_1 = require("../app/modules/plan/plan.model");
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const config_1 = __importDefault(require("../config"));
const createCheckoutSession = async (userdata, planId) => {
    const { authId: userId } = userdata;
    const user = await user_model_1.User.findById(userId);
    if (!user)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    const plan = await plan_model_1.Plan.findById(planId);
    if (!plan)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Plan not found!');
    if (!plan.priceId)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Plan missing Stripe Price ID');
    if (!user.email)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'User missing email');
    const mode = plan.paymentType === 'One Time' ? 'payment' : 'subscription';
    const session = await stripe_1.default.checkout.sessions.create({
        mode,
        payment_method_types: ['card'],
        line_items: [
            {
                price: plan.priceId.toString(),
                quantity: 1,
            },
        ],
        customer_email: user.email.toString(),
        success_url: `${config_1.default.stripe.paymentSuccess}/?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config_1.default.stripe.paymentSuccess}/payments/cancel`,
        metadata: {
            planId: plan._id.toString(),
            userId: user._id.toString(),
        },
        // For subscriptions, we can also add dynamic tax or other settings here
        // For payments (One Time), we might want to capture payment intent details
    });
    if (!session.url)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create Stripe session');
    return session.url;
};
exports.createCheckoutSession = createCheckoutSession;
