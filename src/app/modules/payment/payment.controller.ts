import { Request, Response } from 'express'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import { PaymentService } from './payment.service'
import { JwtPayload } from 'jsonwebtoken'

const createBookingSession = catchAsync(async (req: Request, res: Response) => {
  const { bookingId } = req.params
  const result = await PaymentService.createBookingCheckoutSession(
    req.user as JwtPayload,
    bookingId,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Booking checkout session created successfully',
    data: result,
  })
})

export const PaymentController = {
  createBookingSession,
}
