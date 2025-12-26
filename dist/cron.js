"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const logger_1 = require("./shared/logger");
const invoice_service_1 = require("./app/modules/invoice/invoice.service");
const initCronJobs = () => {
    // Schedule to run at 00:00 on the 1st day of every month
    node_cron_1.default.schedule('0 0 1 * *', async () => {
        logger_1.logger.info('⏳ Running Monthly Invoice Generation Job...');
        try {
            const invoices = await invoice_service_1.InvoiceService.generateInvoices();
            logger_1.logger.info(`✅ Generated ${invoices.length} invoices for the month.`);
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to run Monthly Invoice Generation Job', error);
        }
    });
};
exports.cronJobs = {
    initCronJobs,
};
