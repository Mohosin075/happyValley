"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const subscription_model_1 = require("./subscription.model");
const stripe_1 = __importDefault(require("../../../config/stripe"));
const user_model_1 = require("../user/user.model");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
// import checkUsage from './checkSubscription'
const subscriptionDetailsFromDB = async (user) => {
    var _a;
    const subscription = await subscription_model_1.Subscription.findOne({ user: user.authId })
        .populate('plan', 'title price duration type')
        .lean();
    console.log({ subscription });
    if (!subscription) {
        return {}; // Return empty object if no subscription found
    }
    // 🧩 If it's a free plan, skip Stripe check
    const isFreePlan = ((_a = subscription === null || subscription === void 0 ? void 0 : subscription.plan) === null || _a === void 0 ? void 0 : _a.price) === 0 || !subscription.subscriptionId;
    if (isFreePlan) {
        return subscription;
    }
    try {
        const subscriptionFromStripe = await stripe_1.default.subscriptions.retrieve(subscription.subscriptionId);
        // Check subscription status and update database accordingly
        if ((subscriptionFromStripe === null || subscriptionFromStripe === void 0 ? void 0 : subscriptionFromStripe.status) !== 'active') {
            await Promise.all([
                user_model_1.User.findByIdAndUpdate(user.authId, { subscribe: false }, { new: true }),
                subscription_model_1.Subscription.findOneAndUpdate({ user: user.authId }, { status: 'expired' }, { new: true }),
            ]);
        }
        return subscription;
    }
    catch (error) {
        console.error('Stripe subscription retrieval failed:', error.message);
        // If Stripe check fails, fallback to marking it as expired
        await subscription_model_1.Subscription.findOneAndUpdate({ user: user.authId }, { status: 'expired' }, { new: true });
        return subscription;
    }
};
const subscriptionsFromDB = async (query) => {
    const result = new QueryBuilder_1.default(subscription_model_1.Subscription.find(), query).paginate();
    const subscriptions = await result.modelQuery
        .populate([
        {
            path: 'plan',
            select: 'title price duration',
        },
        {
            path: 'user',
            select: 'name email profile',
        },
    ])
        .select('-createdAt -updatedAt -__v -customerId -subscriptionId')
        .lean();
    const pagination = await result.getPaginationInfo();
    return { subscriptions, pagination };
};
exports.SubscriptionService = {
    subscriptionDetailsFromDB,
    subscriptionsFromDB,
};
