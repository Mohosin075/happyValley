"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStripeProductCatalog = void 0;
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../config"));
const stripe_1 = __importDefault(require("../config/stripe"));
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const createStripeProductCatalog = async (payload) => {
    // Create Product in Stripe
    const product = await stripe_1.default.products.create({
        name: payload.title,
        description: payload.description,
    });
    let interval = 'month';
    let intervalCount = 1;
    // Map duration to interval_count
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
        default:
            interval = 'month';
            intervalCount = 1; // Defaults to 1 month if duration is not specified
    }
    // Create Price for the Product
    const price = await stripe_1.default.prices.create({
        product: product.id,
        unit_amount: Number(payload.price) * 100, // in cents
        currency: 'usd', // or your chosen currency
        recurring: { interval, interval_count: intervalCount },
    });
    if (!price) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create price in Stripe');
    }
    // Create a Payment Link
    const paymentLink = await stripe_1.default.paymentLinks.create({
        line_items: [
            {
                price: price.id,
                quantity: 1,
            },
        ],
        after_completion: {
            type: 'redirect',
            redirect: {
                url: `${config_1.default.stripe.paymentSuccess}`, // Redirect URL on successful payment
            },
        },
        metadata: {
            productId: product.id,
        },
    });
    if (!paymentLink.url) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create payment link');
    }
    return { productId: product.id, paymentLink: paymentLink.url, priceId: price.id };
};
exports.createStripeProductCatalog = createStripeProductCatalog;
