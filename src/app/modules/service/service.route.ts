import express from 'express';
import { ServiceController } from './service.controller';
import { ServiceValidations } from './service.validation';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enum/user';


const router = express.Router();

router.get(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  ServiceController.getAllServices
);

router.get(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  ServiceController.getSingleService
);

router.post(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  
  validateRequest(ServiceValidations.create),
  ServiceController.createService
);

router.patch(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  
  validateRequest(ServiceValidations.update),
  ServiceController.updateService
);

router.delete(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  ServiceController.deleteService
);

export const ServiceRoutes = router;