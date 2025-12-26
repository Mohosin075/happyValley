"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../../config"));
const stripe_1 = __importDefault(require("../../../config/stripe"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const booking_model_1 = require("../booking/booking.model");
const user_model_1 = require("../user/user.model");
const payment_model_1 = require("./payment.model");
const invoice_model_1 = require("../invoice/invoice.model");
const notifications_service_1 = require("../notifications/notifications.service");
const notifications_constants_1 = require("../notifications/notifications.constants");
const createSession = async (user, booking, type, amount) => {
    const session = await stripe_1.default.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `${type.replace('_', ' ').toUpperCase()}: ${booking.serviceType.title}`,
                        description: `Payment for booking on ${booking.date.toDateString()}`,
                    },
                    unit_amount: Math.round(amount * 100),
                },
                quantity: 1,
            },
        ],
        customer_email: user.email,
        success_url: `${config_1.default.stripe.paymentSuccess}/?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking._id}`,
        cancel_url: `${config_1.default.stripe.paymentSuccess}/payment-cancel`,
        metadata: {
            bookingId: booking._id.toString(),
            userId: user._id.toString(),
            type: 'booking_payment',
            paymentType: type,
        },
    });
    if (!session.url) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create Stripe session');
    }
    return session.url;
};
const createBookingFeeCheckoutSession = async (userPayload, bookingId) => {
    const user = await user_model_1.User.findById(userPayload.authId);
    if (!user)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    const booking = await booking_model_1.Booking.findById(bookingId);
    if (!booking)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Booking not found');
    console.log(booking);
    if (booking.bookingFee <= 0) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Booking fee is not set');
    }
    if (booking.bookingFeeStatus === 'paid') {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Booking fee is already paid');
    }
    return await createSession(user, booking, 'booking_fee', booking.bookingFee);
};
const createServiceChargeCheckoutSession = async (userPayload, bookingId) => {
    const user = await user_model_1.User.findById(userPayload.authId);
    if (!user)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    const booking = await booking_model_1.Booking.findById(bookingId);
    if (!booking)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Booking not found');
    if (booking.serviceCharge <= 0) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Service charge is not set');
    }
    if (booking.serviceChargeStatus === 'paid') {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Service charge is already paid');
    }
    return await createSession(user, booking, 'service_charge', booking.serviceCharge);
};
const createInvoiceCheckoutSession = async (userPayload, invoiceId) => {
    const user = await user_model_1.User.findById(userPayload.authId);
    if (!user)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    const invoice = await invoice_model_1.Invoice.findById(invoiceId);
    if (!invoice)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Invoice not found');
    if (invoice.status === 'paid') {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invoice is already paid');
    }
    const session = await stripe_1.default.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `Invoice for ${invoice.month}`,
                        description: `Payment for invoice ${invoice._id}`,
                    },
                    unit_amount: Math.round(invoice.totalAmount * 100),
                },
                quantity: 1,
            },
        ],
        customer_email: user.email,
        success_url: `${config_1.default.stripe.paymentSuccess}/?session_id={CHECKOUT_SESSION_ID}&invoice_id=${invoice._id}`,
        cancel_url: `${config_1.default.stripe.paymentSuccess}/payment-cancel`,
        metadata: {
            invoiceId: invoice._id.toString(),
            userId: user._id.toString(),
            type: 'invoice_payment',
        },
    });
    if (!session.url) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create Stripe session');
    }
    return session.url;
};
const fulfillBookingPayment = async (session) => {
    const { bookingId, invoiceId, paymentType, type } = session.metadata || {};
    // Handle Invoice Payment
    if (type === 'invoice_payment' && invoiceId) {
        const invoice = await invoice_model_1.Invoice.findById(invoiceId);
        if (!invoice) {
            console.error('Invoice not found during fulfillment:', invoiceId);
            return;
        }
        // Update Invoice Status
        await invoice_model_1.Invoice.findByIdAndUpdate(invoiceId, {
            status: 'paid',
            paymentId: session.id,
        });
        // Update all associated bookings
        await booking_model_1.Booking.updateMany({ _id: { $in: invoice.bookings } }, {
            $set: {
                bookingFeeStatus: 'paid',
                serviceChargeStatus: 'paid',
                // status: 'completed' // They should already be completed to be on invoice
            },
        });
        // Record Payment
        await payment_model_1.Payment.create({
            user: invoice.user,
            amount: (session.amount_total || 0) / 100,
            paymentType: 'subscription', // Using 'subscription' or need new enum 'invoice'
            transactionId: session.id,
            status: 'completed',
            paymentGateway: 'stripe',
        });
        await notifications_service_1.NotificationServices.sendNotification({
            to: invoice.user,
            title: notifications_constants_1.NOTIFICATION_TYPES.PAYMENT_RECEIVED,
            body: `Payment for invoice ${invoice.month} confirmed.`,
            type: notifications_constants_1.NOTIFICATION_TYPES.PAYMENT_RECEIVED,
        });
        return;
    }
    // Handle Booking Payment (original logic)
    if (!bookingId) {
        console.error('Missing bookingId in checkout session metadata:', session.id);
        return;
    }
    const booking = await booking_model_1.Booking.findById(bookingId);
    if (!booking) {
        console.error('Booking not found during fulfillment:', bookingId);
        return;
    }
    const updateData = { paymentId: session.id };
    if (paymentType === 'booking_fee') {
        updateData.bookingFeeStatus = 'paid';
        updateData.status = 'scheduled'; // Optionally move to scheduled when fee is paid
    }
    else if (paymentType === 'service_charge') {
        updateData.serviceChargeStatus = 'paid';
        updateData.status = 'confirmed'; // Optionally move to confirmed when charge is paid
    }
    await booking_model_1.Booking.findByIdAndUpdate(bookingId, updateData);
    // 2. Record the Payment transaction
    await payment_model_1.Payment.create({
        user: booking.user,
        booking: bookingId,
        amount: (session.amount_total || 0) / 100,
        paymentType: paymentType,
        transactionId: session.id,
        status: 'completed',
        paymentGateway: 'stripe',
    });
    console.log(`Booking ${bookingId} (${paymentType}) fulfilled and recorded via Payment module`);
    // 3. Send Notification
    await notifications_service_1.NotificationServices.sendNotification({
        to: booking.user,
        title: notifications_constants_1.NOTIFICATION_TYPES.PAYMENT_RECEIVED,
        body: notifications_constants_1.NOTIFICATION_MESSAGES.PAYMENT_CONFIRMED(paymentType || 'booking', (session.amount_total || 0) / 100),
        type: notifications_constants_1.NOTIFICATION_TYPES.PAYMENT_RECEIVED,
    });
};
exports.PaymentService = {
    createBookingFeeCheckoutSession,
    createServiceChargeCheckoutSession,
    createInvoiceCheckoutSession,
    fulfillBookingPayment,
};
