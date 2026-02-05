import express from 'express'
import { UserController } from './user.controller'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import ApiError from '../../../errors/ApiError'
import { StatusCodes } from 'http-status-codes'
import { S3Helper } from '../../../helpers/image/s3helper'
import fileUploadHandler from '../../middleware/fileUploadHandler'
import {
  createStaffSchema,
  updateAvailabilitySchema,
  updateUserSchema,
} from './user.validation'
import { fileAndBodyProcessorUsingDiskStorage } from '../../middleware/processReqBody'

const router = express.Router()

router.get(
  '/profile',
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.STAFF,
    USER_ROLES.CLIENT,
    USER_ROLES.SUPER_ADMIN,
  ),
  UserController.getProfile,
)

router.patch(
  '/profile',
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.STAFF,
    USER_ROLES.CLIENT,
    USER_ROLES.SUPER_ADMIN,
  ),

  fileAndBodyProcessorUsingDiskStorage(),

  validateRequest(updateUserSchema),
  UserController.updateProfile,
)

router.patch(
  '/availability',
  auth(USER_ROLES.STAFF),
  validateRequest(updateAvailabilitySchema),
  UserController.updateAvailability,
)

router.delete(
  '/profile',
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.STAFF,
    USER_ROLES.CLIENT,
    USER_ROLES.SUPER_ADMIN,
  ),
  UserController.deleteProfile,
)

router
  .route('/')
  .get(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    UserController.getAllUsers,
  )

router.post(
  '/staff',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(createStaffSchema),
  UserController.createStaff,
)
router.get(
  '/staff',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  UserController.getAllStaff,
)

router.get(
  '/staff/service/:serviceId',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  UserController.getStaffsByServiceId,
)

router.get(
  '/staff/:userId',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  UserController.getStaffById,
)

router
  .route('/:userId')
  .get(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    UserController.getUserById,
  )
  .delete(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    UserController.deleteUser,
  )
  .patch(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    validateRequest(updateUserSchema),
    UserController.updateUser,
  )

export const UserRoutes = router
