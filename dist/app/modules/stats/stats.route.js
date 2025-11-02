"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsRoutes = void 0;
const express_1 = __importDefault(require("express"));
const stats_controller_1 = require("./stats.controller");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const router = express_1.default.Router();
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.CREATOR, user_1.USER_ROLES.USER), stats_controller_1.StatsController.getAllPlatformStats);
router.get('/user-content-stats', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.CREATOR, user_1.USER_ROLES.USER), stats_controller_1.StatsController.getUserStats);
exports.StatsRoutes = router;
