"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralRoutes = void 0;
const express_1 = __importDefault(require("express"));
const referral_controller_1 = require("./referral.controller");
const referral_validation_1 = require("./referral.validation");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const router = express_1.default.Router();
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.STAFF), referral_controller_1.ReferralController.getAllReferrals);
router.get('/:id', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.STAFF), referral_controller_1.ReferralController.getSingleReferral);
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.CLIENT, user_1.USER_ROLES.STAFF), (0, validateRequest_1.default)(referral_validation_1.ReferralValidations.create), referral_controller_1.ReferralController.createReferral);
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(referral_validation_1.ReferralValidations.update), referral_controller_1.ReferralController.updateReferral);
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), referral_controller_1.ReferralController.deleteReferral);
exports.ReferralRoutes = router;
