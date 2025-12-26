import express from 'express'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { InvoiceController } from './invoice.controller'

const router = express.Router()

router.post(
    '/generate',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    InvoiceController.generateInvoices,
)

router.get(
    '/my-invoices',
    auth(USER_ROLES.CLIENT, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    InvoiceController.getMyInvoices,
)

router.get(
    '/:id',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.CLIENT),
    InvoiceController.getSingleInvoice,
)

router.get(
    '/',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    InvoiceController.getAllInvoices,
)

export const InvoiceRoutes = router
