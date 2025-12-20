import express from 'express'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { PaymentController } from './payment.controller'

const router = express.Router()

router.post(
  '/pay-booking-fee/:bookingId',
  auth(USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.CLIENT),
  PaymentController.createBookingSession,
)

export const PaymentRoutes = router
