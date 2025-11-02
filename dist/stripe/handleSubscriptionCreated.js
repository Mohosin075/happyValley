"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSubscriptionCreated = exports.createNewSubscription = void 0;
const http_status_codes_1 = require("http-status-codes");
const user_model_1 = require("../app/modules/user/user.model");
const subscription_model_1 = require("../app/modules/subscription/subscription.model");
const plan_model_1 = require("../app/modules/plan/plan.model");
const stripe_1 = __importDefault(require("../config/stripe"));
const ApiError_1 = __importDefault(require("../errors/ApiError"));
// Helper function to create new subscription in database
const createNewSubscription = async (payload) => {
    const isExistSubscription = await subscription_model_1.Subscription.findOne({
        user: payload.user,
    });
    if (isExistSubscription) {
        await subscription_model_1.Subscription.findByIdAndUpdate({ _id: isExistSubscription._id }, payload, { new: true });
    }
    else {
        const newSubscription = new subscription_model_1.Subscription(payload);
        await newSubscription.save();
    }
};
exports.createNewSubscription = createNewSubscription;
const handleSubscriptionCreated = async (data) => {
    var _a, _b;
    try {
        // Retrieve subscription details from Stripe
        const subscription = await stripe_1.default.subscriptions.retrieve(data.id, {
            expand: ['latest_invoice.payment_intent'],
        });
        const customer = (await stripe_1.default.customers.retrieve(subscription.customer));
        const productId = (_b = (_a = subscription.items.data[0]) === null || _a === void 0 ? void 0 : _a.price) === null || _b === void 0 ? void 0 : _b.product;
        const invoice = subscription.latest_invoice;
        const trxId = invoice === null || invoice === void 0 ? void 0 : invoice.payment_intent;
        const amountPaid = ((invoice === null || invoice === void 0 ? void 0 : invoice.total) || 0) / 100;
        // Find user and pricing plan
        const user = (await user_model_1.User.findOne({ email: customer.email }));
        if (!user) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Invalid User!');
        }
        const plan = (await plan_model_1.Plan.findOne({ productId }));
        if (!plan) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Invalid Plan!');
        }
        const currentPeriodStart = subscription.start_date
            ? new Date(subscription.start_date * 1000).toISOString()
            : null;
        let currentPeriodEnd = null;
        if (subscription.start_date) {
            // Use plan interval to calculate end date
            const planInterval = plan.interval || 'month'; // 'month' or 'year'
            const intervalCount = plan.interval_count || 1;
            const start = new Date(subscription.start_date * 1000);
            if (planInterval === 'month')
                start.setMonth(start.getMonth() + intervalCount);
            else if (planInterval === 'year')
                start.setFullYear(start.getFullYear() + intervalCount);
            currentPeriodEnd = start.toISOString();
        }
        const payload = {
            customerId: customer.id,
            price: amountPaid,
            user: user._id,
            plan: plan._id,
            trxId,
            subscriptionId: subscription.id,
            status: 'active',
            currentPeriodStart,
            currentPeriodEnd,
        };
        await (0, exports.createNewSubscription)(payload);
        await user_model_1.User.findByIdAndUpdate({ _id: user._id }, { subscribe: true }, { new: true });
    }
    catch (error) {
        console.error('Error in handleSubscriptionCreated:', error);
        return error;
    }
};
exports.handleSubscriptionCreated = handleSubscriptionCreated;
