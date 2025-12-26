"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("./user.controller");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const user_validation_1 = require("./user.validation");
const processReqBody_1 = require("../../middleware/processReqBody");
const router = express_1.default.Router();
router.get('/profile', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.STAFF, user_1.USER_ROLES.CLIENT, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getProfile);
router.patch('/profile', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.STAFF, user_1.USER_ROLES.CLIENT, user_1.USER_ROLES.SUPER_ADMIN), (0, processReqBody_1.fileAndBodyProcessorUsingDiskStorage)(), (0, validateRequest_1.default)(user_validation_1.updateUserSchema), user_controller_1.UserController.updateProfile);
router.delete('/profile', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.STAFF, user_1.USER_ROLES.CLIENT, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.deleteProfile);
router
    .route('/')
    .get((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getAllUsers);
router.post('/staff', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(user_validation_1.createStaffSchema), user_controller_1.UserController.createStaff);
router.get('/staff', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getAllStaff);
router.get('/staff/service/:serviceId', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getStaffsByServiceId);
router.get('/staff/:userId', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getStaffById);
router
    .route('/:userId')
    .get((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getUserById)
    .delete((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.deleteUser)
    .patch((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(user_validation_1.updateUserSchema), user_controller_1.UserController.updateUserStatus);
exports.UserRoutes = router;
