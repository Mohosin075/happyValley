import cron from 'node-cron'
import { logger } from './shared/logger'
import { InvoiceService } from './app/modules/invoice/invoice.service'

const initCronJobs = () => {
    // Schedule to run at 00:00 on the 1st day of every month
    cron.schedule('0 0 1 * *', async () => {
        logger.info('⏳ Running Monthly Invoice Generation Job...')
        try {
            const invoices = await InvoiceService.generateInvoices()
            logger.info(`✅ Generated ${invoices.length} invoices for the month.`)
        } catch (error) {
            logger.error('❌ Failed to run Monthly Invoice Generation Job', error)
        }
    })
}

export const cronJobs = {
    initCronJobs,
}
