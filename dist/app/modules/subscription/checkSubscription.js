"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndIncrementUsage = exports.handleFreeSubscriptionCreate = exports.resetWeeklyUsageIfNeeded = exports.checkBusinessManage = void 0;
const subscription_model_1 = require("./subscription.model");
const plan_model_1 = require("../plan/plan.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const handleSubscriptionCreated_1 = require("../../../stripe/handleSubscriptionCreated");
const user_model_1 = require("../user/user.model");
const checkBusinessManage = async (user) => {
    var _a, _b, _c, _d, _e;
    // TODO ---> Remove static Id
    const isUserExist = await user_model_1.User.findById(user.authId || '68b1fd9e3a485a0f4fc4b527');
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'User not found!');
    }
    await (0, exports.handleFreeSubscriptionCreate)(user);
    const subscription = await subscription_model_1.Subscription.findOne({
        user: user.authId,
        status: 'active',
    }).populate('plan', 'limits name price');
    if (subscription) {
        const businessUsed = (_b = (_a = subscription.usage) === null || _a === void 0 ? void 0 : _a.businessesUsed) !== null && _b !== void 0 ? _b : 0;
        const businessLimit = (_e = (_d = (_c = subscription.plan) === null || _c === void 0 ? void 0 : _c.limits) === null || _d === void 0 ? void 0 : _d.businessesManageable) !== null && _e !== void 0 ? _e : 0;
        if (businessUsed >= businessLimit) {
            throw new ApiError_1.default(400, `You have reached the maximum businesses you can manage (${businessLimit}). Please upgrade your plan to manage more.`);
        }
    }
};
exports.checkBusinessManage = checkBusinessManage;
const resetWeeklyUsageIfNeeded = async (subscription) => {
    const now = new Date();
    const lastReset = subscription.lastReset
        ? new Date(subscription.lastReset)
        : now;
    const diffInMs = now.getTime() - lastReset.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    console.log({ diffInDays, diffInMs });
    if (diffInDays >= 7) {
        subscription.usage = {
            reelsUsed: 0,
            postsUsed: 0,
            storiesUsed: 0,
            businessesUsed: 0,
            carouselUsed: 0,
        };
        subscription.lastReset = now;
        console.log(now);
        await subscription.save();
    }
};
exports.resetWeeklyUsageIfNeeded = resetWeeklyUsageIfNeeded;
const handleFreeSubscriptionCreate = async (user, session) => {
    const plan = await plan_model_1.Plan.findOne({ price: 0, status: 'active' });
    if (!plan) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Free Plan not found!');
    }
    const now = new Date();
    const currentPeriodStart = now.toISOString();
    const currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
    const payload = {
        price: 0,
        user: user.authId,
        plan: plan._id,
        status: 'active',
        currentPeriodStart,
        currentPeriodEnd,
    };
    const subscription = await subscription_model_1.Subscription.findOne({
        user: user.authId,
        status: 'active',
    });
    if (!subscription) {
        await (0, handleSubscriptionCreated_1.createNewSubscription)(payload); // external operation, not part of DB session
    }
    return subscription;
};
exports.handleFreeSubscriptionCreate = handleFreeSubscriptionCreate;
const checkAndIncrementUsage = async (user, type) => {
    await (0, exports.handleFreeSubscriptionCreate)(user);
    const subscription = await subscription_model_1.Subscription.findOne({
        user: user.authId,
        status: 'active',
    }).populate('plan');
    if (!subscription) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Subscription not found!');
    }
    // Reset weekly usage if 1 week passed
    await (0, exports.resetWeeklyUsageIfNeeded)(subscription);
    const usageMap = {
        reel: 'reelsUsed',
        post: 'postsUsed',
        story: 'storiesUsed',
        carousel: 'carouselUsed',
    };
    const limitMap = {
        reel: 'reelsPerWeek',
        post: 'postsPerWeek',
        story: 'storiesPerWeek',
        carousel: 'carouselPerWeek',
    };
    const usageKey = usageMap[type];
    const limitKey = limitMap[type];
    const used = subscription.usage[usageKey];
    const limit = subscription.plan.limits[limitKey];
    console.log({ used, limitKey });
    if (used >= limit) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Limit reached for ${type}. Please upgrade.`);
    }
    const usageKeyField = `usage.${usageKey}`;
    await subscription_model_1.Subscription.findByIdAndUpdate(subscription._id, { $inc: { [usageKeyField]: 1 } }, { new: true }).orFail();
    return { subscriptionId: subscription._id, type, used: used + 1, limit };
};
exports.checkAndIncrementUsage = checkAndIncrementUsage;
