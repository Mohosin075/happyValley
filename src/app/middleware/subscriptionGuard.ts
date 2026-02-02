import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../../errors/ApiError'
import { User } from '../modules/user/user.model'

const subscriptionGuard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user as any)?.authId
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not authenticated')
    }

    const user = await User.findById(userId).select('subscribe')
    if (!user) {
      throw new ApiError(
        StatusCodes.PAYMENT_REQUIRED,
        'Active subscription required to access this resource'
      )
    }

    next()
  } catch (error) {
    next(error)
  }
}

export default subscriptionGuard
