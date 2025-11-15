import express from 'express'
import { ReferralController } from './referral.controller'
import { ReferralValidations } from './referral.validation'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'

const router = express.Router()

router.get(
  '/',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  ReferralController.getAllReferrals,
)

router.get(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  ReferralController.getSingleReferral,
)

router.post(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.CLIENT,
    USER_ROLES.STAFF,
  ),

  validateRequest(ReferralValidations.create),
  ReferralController.createReferral,
)

router.patch(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),

  validateRequest(ReferralValidations.update),
  ReferralController.updateReferral,
)

router.delete(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  ReferralController.deleteReferral,
)

export const ReferralRoutes = router
