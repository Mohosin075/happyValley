"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgreementRoutes = void 0;
const express_1 = __importDefault(require("express"));
const agreement_controller_1 = require("./agreement.controller");
const agreement_validation_1 = require("./agreement.validation");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const router = express_1.default.Router();
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.CLIENT, user_1.USER_ROLES.STAFF), agreement_controller_1.AgreementController.getAllAgreements);
router.get('/:id', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.CLIENT, user_1.USER_ROLES.STAFF), agreement_controller_1.AgreementController.getSingleAgreement);
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.CLIENT, user_1.USER_ROLES.STAFF), (0, validateRequest_1.default)(agreement_validation_1.AgreementValidations.create), agreement_controller_1.AgreementController.createAgreement);
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), agreement_controller_1.AgreementController.getAllAgreements);
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), agreement_controller_1.AgreementController.deleteAgreement);
exports.AgreementRoutes = router;
