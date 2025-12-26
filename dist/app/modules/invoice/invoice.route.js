"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const invoice_controller_1 = require("./invoice.controller");
const router = express_1.default.Router();
router.post('/generate', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), invoice_controller_1.InvoiceController.generateInvoices);
router.get('/my-invoices', (0, auth_1.default)(user_1.USER_ROLES.CLIENT, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), invoice_controller_1.InvoiceController.getMyInvoices);
router.get('/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.CLIENT), invoice_controller_1.InvoiceController.getSingleInvoice);
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), invoice_controller_1.InvoiceController.getAllInvoices);
exports.InvoiceRoutes = router;
