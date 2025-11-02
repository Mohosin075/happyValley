"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStripeProductCatalog = void 0;
const http_status_codes_1 = require("http-status-codes");
const stripe_1 = __importDefault(require("../config/stripe"));
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const config_1 = __importDefault(require("../config"));
const updateStripeProductCatalog = async (productId, payload) => {
    // Map duration to interval
    let interval = 'month';
    let intervalCount = 1;
    switch (payload.duration) {
        case '1 month':
            interval = 'month';
            intervalCount = 1;
            break;
        case '3 months':
            interval = 'month';
            intervalCount = 3;
            break;
        case '6 months':
            interval = 'month';
            intervalCount = 6;
            break;
        case '1 year':
            interval = 'year';
            intervalCount = 1;
            break;
    }
    // Step 0: Update product details in Stripe
    await stripe_1.default.products.update(productId, {
        name: payload.title,
        description: payload.description,
    });
    // Step 1: Deactivate old prices
    const oldPrices = await stripe_1.default.prices.list({
        product: productId,
        active: true,
    });
    for (const oldPrice of oldPrices.data) {
        await stripe_1.default.prices.update(oldPrice.id, { active: false });
    }
    // Step 2: Create new price
    const price = await stripe_1.default.prices.create({
        product: productId,
        unit_amount: payload.price * 100,
        currency: 'usd',
        recurring: { interval, interval_count: intervalCount },
    });
    if (!price)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create new price in Stripe');
    // Step 3: Create payment link
    let paymentLink;
    try {
        paymentLink = await stripe_1.default.paymentLinks.create({
            line_items: [{ price: price.id, quantity: 1 }],
            after_completion: {
                type: 'redirect',
                redirect: { url: config_1.default.clientUrl },
            },
            metadata: { productId },
        });
    }
    catch (err) {
        console.error('Error creating payment link:', err);
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create new payment link');
    }
    // Step 4: Build full updated plan object
    const updatedPlan = {
        title: payload.title,
        description: payload.description,
        priceId: price.id,
        price: payload.price,
        duration: payload.duration,
        paymentType: payload.paymentType || (interval === 'year' ? 'Yearly' : 'Monthly'),
        productId,
        paymentLink: paymentLink.url,
        status: 'active',
        _id: payload._id || undefined,
    };
    return updatedPlan;
};
exports.updateStripeProductCatalog = updateStripeProductCatalog;
