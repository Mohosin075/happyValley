"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSubscriptionDeleted = exports.handlePaymentSucceeded = exports.handlePaymentFailed = exports.handleSubscriptionCreated = exports.handleCheckoutSessionCompleted = exports.createSubscriptionPayment = exports.createNewSubscription = void 0;
const user_model_1 = require("../app/modules/user/user.model");
const subscription_model_1 = require("../app/modules/subscription/subscription.model");
const plan_model_1 = require("../app/modules/plan/plan.model");
const stripe_1 = __importDefault(require("../config/stripe"));
const payment_model_1 = require("../app/modules/payment/payment.model");
const notifications_service_1 = require("../app/modules/notifications/notifications.service");
const notifications_constants_1 = require("../app/modules/notifications/notifications.constants");
// Helper function to create new subscription in database
const createNewSubscription = async (payload) => {
    const isExistSubscription = await subscription_model_1.Subscription.findOne({
        user: payload.user,
    });
    if (isExistSubscription) {
        return await subscription_model_1.Subscription.findByIdAndUpdate({ _id: isExistSubscription._id }, payload, { new: true });
    }
    else {
        const newSubscription = new subscription_model_1.Subscription(payload);
        return await newSubscription.save();
    }
};
exports.createNewSubscription = createNewSubscription;
// Utility function to record payment in Payment model
const createSubscriptionPayment = async (data) => {
    try {
        const paymentData = {
            user: data.user,
            subscription: data.subscription,
            amount: data.amount,
            paymentType: 'subscription',
            transactionId: data.transactionId,
            status: 'completed',
            paymentGateway: 'stripe',
        };
        console.log({ paymentData });
        const result = await payment_model_1.Payment.create(paymentData);
        console.log({ result });
        console.log(`Payment record created for subscription: ${data.transactionId}`);
        return result;
    }
    catch (error) {
        console.error(`Error creating payment record for subscription:`, error);
    }
};
exports.createSubscriptionPayment = createSubscriptionPayment;
const handleCheckoutSessionCompleted = async (session) => {
    try {
        const { userId, planId } = session.metadata || {};
        console.log('Checkout Session Metadata:', { userId, planId });
        console.log('Checkout Session Object Keys:', Object.keys(session));
        console.log('Checkout Session ID:', session.id);
        console.log('Checkout Session Subscription:', session.subscription);
        if (!userId || !planId) {
            console.error('Missing metadata in checkout session:', session.id);
            return;
        }
        const plan = (await plan_model_1.Plan.findById(planId));
        if (!plan) {
            console.error('Plan not found for checkout session:', planId);
            return;
        }
        const user = await user_model_1.User.findById(userId);
        if (!user) {
            console.error('User not found for checkout session:', userId);
            return;
        }
        let subscriptionId = session.subscription;
        let trxId = session.payment_intent;
        // If it's a one-time payment, we might not have a subscriptionId
        const isOneTime = plan.paymentType === 'One Time';
        let currentPeriodStart = new Date();
        let currentPeriodEnd = new Date();
        if (!isOneTime && subscriptionId) {
            const stripeSubscription = await stripe_1.default.subscriptions.retrieve(subscriptionId);
            currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
            currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
        }
        else {
            currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
        }
        const payload = {
            customerId: session.customer,
            price: (session.amount_total || 0) / 100,
            user: userId,
            plan: planId,
            trxId,
            subscriptionId: subscriptionId || `one_time_${session.id}`,
            status: 'active',
            currentPeriodStart,
            currentPeriodEnd,
        };
        const subscription = await (0, exports.createNewSubscription)(payload);
        console.log('Subscription processed:', subscription === null || subscription === void 0 ? void 0 : subscription._id);
        // Record the Payment transaction
        console.log('Checking if payment should be recorded:', { price: payload.price });
        if (payload.price > 0) {
            console.log('Recording payment transaction for subscription:', subscriptionId);
            await (0, exports.createSubscriptionPayment)({
                user: userId,
                subscription: subscription === null || subscription === void 0 ? void 0 : subscription._id,
                amount: payload.price,
                transactionId: session.id, // Consistent with direct payment logic
            });
        }
        await user_model_1.User.findByIdAndUpdate(userId, { subscribe: true });
        console.log(`Fulfillment completed for user: ${userId}, Plan: ${planId}`);
        // Send Notification
        await notifications_service_1.NotificationServices.sendNotification({
            to: userId,
            title: notifications_constants_1.NOTIFICATION_TYPES.SUBSCRIPTION_ACTIVATED,
            body: notifications_constants_1.NOTIFICATION_MESSAGES.SUBSCRIPTION_SUCCESS(plan.title),
            type: notifications_constants_1.NOTIFICATION_TYPES.SUBSCRIPTION_ACTIVATED,
        });
    }
    catch (error) {
        console.error('Error in handleCheckoutSessionCompleted:', error);
    }
};
exports.handleCheckoutSessionCompleted = handleCheckoutSessionCompleted;
const handleSubscriptionCreated = async (data) => {
    var _a, _b, _c;
    // Use checkout.session.completed for initial creation. 
    // This handler can be used for subscription updates or logic that doesn't rely on checkout sessions.
    try {
        const subscriptionData = await stripe_1.default.subscriptions.retrieve(data.id);
        // Fallback lookup if needed, but prefer checkout session metadata for initial setup
        const customer = (await stripe_1.default.customers.retrieve(subscriptionData.customer));
        const user = await user_model_1.User.findOne({ email: customer.email });
        if (!user)
            return;
        const productId = (_b = (_a = subscriptionData.items.data[0]) === null || _a === void 0 ? void 0 : _a.price) === null || _b === void 0 ? void 0 : _b.product;
        const plan = await plan_model_1.Plan.findOne({ productId });
        if (!plan)
            return;
        // console.log('Stripe Subscription Data Keys:', Object.keys(subscriptionData))
        const startTimestamp = subscriptionData.current_period_start || data.current_period_start;
        const endTimestamp = subscriptionData.current_period_end || data.current_period_end;
        console.log({ startTimestamp, endTimestamp });
        const currentPeriodStart = startTimestamp ? new Date(startTimestamp * 1000) : new Date();
        const currentPeriodEnd = endTimestamp ? new Date(endTimestamp * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        if (isNaN(currentPeriodStart.getTime()) || isNaN(currentPeriodEnd.getTime())) {
            console.error('Invalid date generated from timestamps, using fallbacks:', { startTimestamp, endTimestamp });
        }
        const payload = {
            customerId: customer.id,
            price: ((_c = subscriptionData.plan) === null || _c === void 0 ? void 0 : _c.amount) / 100 || 0,
            user: user._id,
            plan: plan._id,
            subscriptionId: subscriptionData.id,
            status: subscriptionData.status === 'active' ? 'active' : 'expired',
            currentPeriodStart,
            currentPeriodEnd,
        };
        const subscription = await (0, exports.createNewSubscription)(payload);
        // Record the Payment transaction if it's active and has a price
        if (payload.status === 'active' && payload.price > 0) {
            await (0, exports.createSubscriptionPayment)({
                user: user._id,
                subscription: subscription === null || subscription === void 0 ? void 0 : subscription._id, // Use the internal DB _id
                amount: payload.price,
                transactionId: `sub_created_${subscriptionData.id}`,
            });
        }
        if (payload.status === 'active') {
            await user_model_1.User.findByIdAndUpdate(user._id, { subscribe: true });
            // Send Notification
            await notifications_service_1.NotificationServices.sendNotification({
                to: user._id,
                title: notifications_constants_1.NOTIFICATION_TYPES.SUBSCRIPTION_ACTIVATED,
                body: notifications_constants_1.NOTIFICATION_MESSAGES.SUBSCRIPTION_SUCCESS(plan.title),
                type: notifications_constants_1.NOTIFICATION_TYPES.SUBSCRIPTION_ACTIVATED,
            });
        }
    }
    catch (error) {
        console.error('Error in handleSubscriptionCreated:', error);
    }
};
exports.handleSubscriptionCreated = handleSubscriptionCreated;
const handlePaymentFailed = async (invoice) => {
    try {
        const subscriptionId = invoice.subscription;
        if (!subscriptionId)
            return;
        const subscription = await subscription_model_1.Subscription.findOne({ subscriptionId });
        if (subscription) {
            await Promise.all([
                subscription_model_1.Subscription.findByIdAndUpdate(subscription._id, { status: 'expired' }),
                user_model_1.User.findByIdAndUpdate(subscription.user, { subscribe: false }),
            ]);
            console.log(`Payment failed for subscription: ${subscriptionId}. User deactivated.`);
            // Send Notification
            await notifications_service_1.NotificationServices.sendNotification({
                to: subscription.user,
                title: 'Subscription Payment Failed',
                body: notifications_constants_1.NOTIFICATION_MESSAGES.SUBSCRIPTION_FAILED,
                type: notifications_constants_1.NOTIFICATION_TYPES.SYSTEM,
            });
        }
    }
    catch (error) {
        console.error('Error in handlePaymentFailed:', error);
    }
};
exports.handlePaymentFailed = handlePaymentFailed;
const handlePaymentSucceeded = async (invoice) => {
    var _a, _b, _c;
    try {
        const subscriptionId = invoice.subscription;
        console.log('Invoice Payment Succeeded Data:', {
            subscriptionId,
            invoiceId: invoice.id,
            paymentIntent: invoice.payment_intent,
            customer: invoice.customer,
            amount: invoice.amount_paid,
            metadata: invoice.metadata
        });
        if (!subscriptionId) {
            console.log('SubscriptionId is missing in invoice, checking lines...');
            const lineSubscription = (_c = (_b = (_a = invoice.lines) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.find(line => line.subscription)) === null || _c === void 0 ? void 0 : _c.subscription;
            console.log('SubscriptionId from lines:', lineSubscription);
        }
        let subscription = await subscription_model_1.Subscription.findOne({ subscriptionId: subscriptionId || { $ne: null } });
        if (!subscription && invoice.customer) {
            console.log('Subscription not found by ID, searching by customerId:', invoice.customer);
            // Look for the most recent active or recently created subscription for this customer
            subscription = await subscription_model_1.Subscription.findOne({
                customerId: invoice.customer
            }).sort({ createdAt: -1 });
        }
        console.log('Subscription found in DB:', subscription === null || subscription === void 0 ? void 0 : subscription._id);
        if (subscription) {
            // If it's a renewal, update the period dates
            const stripeSubscription = await stripe_1.default.subscriptions.retrieve(subscriptionId);
            const startTimestamp = stripeSubscription.current_period_start;
            const endTimestamp = stripeSubscription.current_period_end;
            if (!startTimestamp || !endTimestamp) {
                console.error('Missing period timestamps in Stripe subscription renewal:', subscriptionId);
                return;
            }
            const currentPeriodStart = new Date(startTimestamp * 1000);
            const currentPeriodEnd = new Date(endTimestamp * 1000);
            if (isNaN(currentPeriodStart.getTime()) || isNaN(currentPeriodEnd.getTime())) {
                console.error('Invalid date generated during renewal:', { startTimestamp, endTimestamp });
                return;
            }
            await subscription_model_1.Subscription.findByIdAndUpdate(subscription._id, {
                status: 'active',
                currentPeriodStart,
                currentPeriodEnd,
            });
            // Record the Payment transaction for renewal
            console.log('Checking renewal payment:', { amount_paid: invoice.amount_paid });
            if (invoice.amount_paid > 0) {
                console.log('Recording payment transaction for renewal: 11111111', subscriptionId);
                await (0, exports.createSubscriptionPayment)({
                    user: subscription.user,
                    subscription: subscription._id,
                    amount: (invoice.amount_paid || 0) / 100,
                    transactionId: (invoice.payment_intent || invoice.id),
                });
            }
            await user_model_1.User.findByIdAndUpdate(subscription.user, { subscribe: true });
            console.log(`Payment succeeded for subscription: ${subscriptionId}. User activated/renewed.`);
            // Send Notification
            const plan = await plan_model_1.Plan.findById(subscription.plan);
            await notifications_service_1.NotificationServices.sendNotification({
                to: subscription.user,
                title: notifications_constants_1.NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED,
                body: notifications_constants_1.NOTIFICATION_MESSAGES.SUBSCRIPTION_RENEWAL((plan === null || plan === void 0 ? void 0 : plan.title) || 'Plan'),
                type: notifications_constants_1.NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED,
            });
        }
    }
    catch (error) {
        console.error('Error in handlePaymentSucceeded:', error);
    }
};
exports.handlePaymentSucceeded = handlePaymentSucceeded;
const handleSubscriptionDeleted = async (data) => {
    try {
        const subscriptionId = data.id;
        const subscription = await subscription_model_1.Subscription.findOne({ subscriptionId });
        if (subscription) {
            await Promise.all([
                subscription_model_1.Subscription.findByIdAndUpdate(subscription._id, { status: 'expired' }),
                user_model_1.User.findByIdAndUpdate(subscription.user, { subscribe: false }),
            ]);
        }
    }
    catch (error) {
        console.error('Error in handleSubscriptionDeleted:', error);
    }
};
exports.handleSubscriptionDeleted = handleSubscriptionDeleted;
