"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const subscription_service_1 = require("./subscription.service");
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
// export const createCheckoutSession = async (req: Request, res: Response) => {
//   const { planId } = req.body
//   const user = req.user as JwtPayload
//   const plan = await Plan.findById(planId)
//   if (!plan) throw new ApiError(404, 'Plan not found!')
//   // You should store Stripe Price ID in plan
//   const session = await stripe.checkout.sessions.create({
//     payment_method_types: ['card'],
//     mode: 'subscription',
//     customer_email: user.email, // optional if you have user email
//     line_items: [
//       {
//         price: plan.priceId, // this comes from Stripe Price ID
//         quantity: 1,
//       },
//     ],
//     success_url: `${config.clientUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
//     cancel_url: `${config.clientUrl}/subscription/cancel`,
//   })
//   res.status(200).json({ url: session.url })
// }
const subscriptions = (0, catchAsync_1.default)(async (req, res) => {
    const result = await subscription_service_1.SubscriptionService.subscriptionsFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Subscription List Retrieved Successfully',
        data: result,
    });
});
const subscriptionDetails = (0, catchAsync_1.default)(async (req, res) => {
    const result = await subscription_service_1.SubscriptionService.subscriptionDetailsFromDB(req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Subscription Details Retrieved Successfully',
        data: result,
    });
});
exports.SubscriptionController = {
    subscriptions,
    subscriptionDetails,
};
