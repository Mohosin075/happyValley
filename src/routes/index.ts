import { UserRoutes } from '../app/modules/user/user.route'
import { AuthRoutes } from '../app/modules/auth/auth.route'
import express, { Router } from 'express'
import { NotificationRoutes } from '../app/modules/notifications/notifications.route'
import { PublicRoutes } from '../app/modules/public/public.route'
import { SupportRoutes } from '../app/modules/support/support.route'
import { PlanRoutes } from '../app/modules/plan/plan.routes'
import { SubscriptionRoutes } from '../app/modules/subscription/subscription.routes'
import { ServiceRoutes } from '../app/modules/service/service.route'
import { BookingRoutes } from '../app/modules/booking/booking.route'
import { ReferralRoutes } from '../app/modules/referral/referral.route'
import { AgreementRoutes } from '../app/modules/agreement/agreement.route'

const router = express.Router()

const apiRoutes: { path: string; route: Router }[] = [
  { path: '/user', route: UserRoutes },
  { path: '/auth', route: AuthRoutes },
  { path: '/notifications', route: NotificationRoutes },
  { path: '/public', route: PublicRoutes },
  { path: '/support', route: SupportRoutes },
  { path: '/plan', route: PlanRoutes },
  { path: '/subscription', route: SubscriptionRoutes },
  { path: '/service', route: ServiceRoutes },
  { path: '/booking', route: BookingRoutes },
  { path: '/referral', route: ReferralRoutes },
  { path: '/agreement', route: AgreementRoutes }]

apiRoutes.forEach(route => {
  router.use(route.path, route.route)
})

export default router
