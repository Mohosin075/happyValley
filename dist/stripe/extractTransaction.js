"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFromCheckoutSession = exports.extractFromSubscription = exports.extractFromInvoice = exports.expandInvoiceIfNeeded = void 0;
// Expand an invoice when provided as an ID string
const expandInvoiceIfNeeded = async (stripeClient, invoiceLike) => {
    if (!invoiceLike)
        return null;
    if (typeof invoiceLike === 'string') {
        return (await stripeClient.invoices.retrieve(invoiceLike, {
            expand: ['payment_intent', 'charge'],
        }));
    }
    return invoiceLike;
};
exports.expandInvoiceIfNeeded = expandInvoiceIfNeeded;
const extractFromInvoice = (invoice) => {
    var _a, _b;
    if (!invoice)
        return { paymentIntentId: '', chargeId: '', amountPaid: 0 };
    let paymentIntentId = '';
    let chargeId = '';
    const pi = invoice.payment_intent;
    paymentIntentId = typeof pi === 'string' ? pi : (_a = pi === null || pi === void 0 ? void 0 : pi.id) !== null && _a !== void 0 ? _a : '';
    const ch = invoice.charge;
    chargeId = typeof ch === 'string' ? ch : (_b = ch === null || ch === void 0 ? void 0 : ch.id) !== null && _b !== void 0 ? _b : '';
    const amountPaid = (invoice.amount_paid || 0) / 100;
    return { paymentIntentId, chargeId, amountPaid };
};
exports.extractFromInvoice = extractFromInvoice;
const extractFromSubscription = async (stripeClient, subscription) => {
    const invoice = await (0, exports.expandInvoiceIfNeeded)(stripeClient, subscription.latest_invoice);
    return (0, exports.extractFromInvoice)(invoice);
};
exports.extractFromSubscription = extractFromSubscription;
const extractFromCheckoutSession = async (stripeClient, session) => {
    var _a, _b;
    let paymentIntentId = '';
    let chargeId = '';
    let amountPaid = 0;
    const piFromSession = session.payment_intent;
    paymentIntentId =
        typeof piFromSession === 'string' ? piFromSession : (_a = piFromSession === null || piFromSession === void 0 ? void 0 : piFromSession.id) !== null && _a !== void 0 ? _a : '';
    if (paymentIntentId) {
        const pi = await stripeClient.paymentIntents.retrieve(paymentIntentId, {
            expand: ['latest_charge'],
        });
        const latestCharge = pi.latest_charge;
        chargeId = typeof latestCharge === 'string' ? latestCharge : (_b = latestCharge === null || latestCharge === void 0 ? void 0 : latestCharge.id) !== null && _b !== void 0 ? _b : '';
        amountPaid = (pi.amount_received || 0) / 100;
    }
    return { paymentIntentId, chargeId, amountPaid };
};
exports.extractFromCheckoutSession = extractFromCheckoutSession;
