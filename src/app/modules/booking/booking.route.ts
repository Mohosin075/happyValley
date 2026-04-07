import express from 'express'
import { BookingController } from './booking.controller'
import { BookingValidations } from './booking.validation'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import {
  confirmGroceryOrder,
  sendMessageToGroceryBot,
  getPastOrders,
  reuseFromPastOrder,
  getSingleGrocerySession,
  addManualItems,
  getActiveSession,
  removeItemFromGrocerySession,
} from './gorceryChat'
import subscriptionGuard from '../../middleware/subscriptionGuard'

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
    // subscriptionGuard,
    BookingController.myServices,
  )
router
  .route('/my-orders')
  .get(
    auth(
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.ADMIN,
      USER_ROLES.CLIENT,
      USER_ROLES.STAFF,
    ),
    // subscriptionGuard,
    BookingController.myOrder,
  )

// Track upcoming bookings route: /bookings/my-upcoming
router
  .route('/my-upcoming')
  .get(auth(USER_ROLES.STAFF), BookingController.getUpcomingBookings)

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
    validateRequest(BookingValidations.updateBookingStatus),
    BookingController.updateBookingStatus,
  )

router
  .route('/:id/add-price')
  .patch(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    validateRequest(BookingValidations.updatePrice),
    BookingController.updatePrice,
  )

router
  .route('/:id/update-fees')
  .patch(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    validateRequest(BookingValidations.updateFees),
    BookingController.updateBookingFees,
  )

router
  .route('/:id/assign-staff')
  .patch(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    validateRequest(BookingValidations.assignStaff),
    BookingController.assignStaff,
  )

router
  .route('/weekly')
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.STAFF),
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
    validateRequest(BookingValidations.update),
    BookingController.updateBooking,
  )
  .delete(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    BookingController.deleteBooking,
  )


// ====================================
// Kitchen Restock AI Chatbot Routes
// ====================================
router.post('/chat/send', auth(USER_ROLES.CLIENT, USER_ROLES.ADMIN), subscriptionGuard, sendMessageToGroceryBot)
router.post('/chat/confirm', auth(USER_ROLES.CLIENT, USER_ROLES.ADMIN), subscriptionGuard, confirmGroceryOrder)
router.get('/chat/past-orders', auth(USER_ROLES.CLIENT, USER_ROLES.ADMIN), subscriptionGuard, getPastOrders)
router.get('/chat/active-session', auth(USER_ROLES.CLIENT, USER_ROLES.ADMIN), subscriptionGuard, getActiveSession)
router.get('/chat/session/:sessionId', auth(USER_ROLES.CLIENT, USER_ROLES.ADMIN), subscriptionGuard, getSingleGrocerySession)
router.post('/chat/items', auth(USER_ROLES.CLIENT, USER_ROLES.ADMIN), subscriptionGuard, addManualItems)
router.delete('/chat/items', auth(USER_ROLES.CLIENT, USER_ROLES.ADMIN), subscriptionGuard, removeItemFromGrocerySession)
router.post('/chat/reuse', auth(USER_ROLES.CLIENT, USER_ROLES.ADMIN), subscriptionGuard, reuseFromPastOrder)

export const BookingRoutes = router

