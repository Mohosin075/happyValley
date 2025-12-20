import express from 'express'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { PaymentController } from './payment.controller'

const router = express.Router()

router.post(
  '/pay-booking-fee/:bookingId',
  auth(USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.CLIENT),
  PaymentController.createBookingFeeSession,
)

router.post(
  '/pay-service-charge/:bookingId',
  auth(USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.CLIENT),
  PaymentController.createServiceChargeSession,
)

export const PaymentRoutes = router
