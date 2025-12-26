import express from 'express'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { PaymentController } from './payment.controller'

const router = express.Router()

router.post(
  '/invoice-checkout/:invoiceId',
  auth(USER_ROLES.CLIENT, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  PaymentController.createInvoiceSession,
)

router.post(
  '/pay-booking-fee/:bookingId',
  auth(USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.CLIENT),
  PaymentController.createBookingFeeSession,
)

router.post(
  '/pay-service-charge/:bookingId',
  auth(USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.CLIENT, USER_ROLES.SUPER_ADMIN),
  PaymentController.createServiceChargeSession,
)

export const PaymentRoutes = router
