"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const notifications_controller_1 = require("./notifications.controller");
const router = express_1.default.Router();
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.STAFF, user_1.USER_ROLES.CLIENT), notifications_controller_1.NotificationController.getMyNotifications);
router.get('/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.STAFF, user_1.USER_ROLES.CLIENT), notifications_controller_1.NotificationController.updateNotification);
router.get('/all', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.STAFF, user_1.USER_ROLES.CLIENT), notifications_controller_1.NotificationController.updateAllNotifications);
exports.NotificationRoutes = router;
