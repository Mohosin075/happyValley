import express from 'express'
import { BookingController } from './booking.controller'
import { BookingValidations } from './booking.validation'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { confirmGroceryOrder, sendMessageToGroceryBot } from './gorceryChat'

const router = express.Router()

// Base route: /bookings
router
  .route('/')
  .get(
    auth(
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.ADMIN,
      USER_ROLES.CLIENT,
      USER_ROLES.STAFF,
    ),
    BookingController.getAllBookings,
  )
  .post(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.CLIENT),
    validateRequest(BookingValidations.create),
    BookingController.createBooking,
  )

// My services route: /bookings/my-services
router
  .route('/my-services')
  .get(
    auth(
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.ADMIN,
      USER_ROLES.CLIENT,
      USER_ROLES.STAFF,
    ),
    BookingController.myServices,
  )

// Scheduled bookings route: /bookings/scheduled
router
  .route('/scheduled')
  .get(
    auth(
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.ADMIN,
      USER_ROLES.CLIENT,
      USER_ROLES.STAFF,
    ),
    BookingController.getBookingsByDate,
  )

// Update booking status route: /bookings/:id/status
router
  .route('/:id/status')
  .patch(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.STAFF),
    BookingController.updateBookingStatus,
  )

router
  .route('/weekly')
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    BookingController.getWeeklyBookingsByUser,
  )

// Single booking routes: /bookings/:id
router
  .route('/:id')
  .get(
    auth(
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.ADMIN,
      USER_ROLES.CLIENT,
      USER_ROLES.STAFF,
    ),
    BookingController.getSingleBooking,
  )
  .patch(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    BookingController.updateBooking,
  )
  .delete(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    BookingController.deleteBooking,
  )

router.post('/chat/send', auth(USER_ROLES.CLIENT), sendMessageToGroceryBot)
router.post('/chat/confirm', auth(USER_ROLES.CLIENT), confirmGroceryOrder)

export const BookingRoutes = router
