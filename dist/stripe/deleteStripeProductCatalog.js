"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStripeProductCatalog = void 0;
const stripe_1 = __importDefault(require("../config/stripe"));
const deleteStripeProductCatalog = async (productId) => {
    // Fetch all active prices for the product
    const prices = await stripe_1.default.prices.list({ product: productId, active: true });
    // deactivated all the prices
    await Promise.all(prices.data.map((price) => stripe_1.default.prices.update(price.id, { active: false })));
    // deactivated all the products
    const archivedProduct = await stripe_1.default.products.update(productId, { active: false });
    if (archivedProduct) {
        return { success: true };
    }
    return { success: false };
};
exports.deleteStripeProductCatalog = deleteStripeProductCatalog;
