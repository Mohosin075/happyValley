"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionRoutes = void 0;
const express_1 = __importDefault(require("express"));
const subscription_controller_1 = require("./subscription.controller");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const router = express_1.default.Router();
router.post('/create-checkout-session/:planId', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.STAFF, user_1.USER_ROLES.CLIENT), subscription_controller_1.createSession);
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.STAFF, user_1.USER_ROLES.CLIENT), subscription_controller_1.SubscriptionController.subscriptions);
router.get('/my-plan', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.STAFF, user_1.USER_ROLES.CLIENT), subscription_controller_1.SubscriptionController.subscriptionDetails);
exports.SubscriptionRoutes = router;
