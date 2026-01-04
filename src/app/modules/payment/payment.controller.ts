import { Request, Response } from 'express'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import { PaymentService } from './payment.service'
import { JwtPayload } from 'jsonwebtoken'
import pick from '../../../shared/pick'
import { paymentFilterables } from './payment.constants'
import { paginationFields } from '../../../interfaces/pagination'

const createBookingFeeSession = catchAsync(async (req: Request, res: Response) => {
  const { bookingId } = req.params
  const result = await PaymentService.createBookingFeeCheckoutSession(
    req.user as JwtPayload,
    bookingId,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Booking fee checkout session created successfully',
    data: result,
  })
})

const createServiceChargeSession = catchAsync(
  async (req: Request, res: Response) => {
    const { bookingId } = req.params
    const result = await PaymentService.createServiceChargeCheckoutSession(
      req.user as JwtPayload,
      bookingId,
    )

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Service charge checkout session created successfully',
      data: result,
    })
  },
)

const createInvoiceSession = catchAsync(async (req: Request, res: Response) => {
  const { invoiceId } = req.params
  const result = await PaymentService.createInvoiceCheckoutSession(
    req.user as JwtPayload,
    invoiceId,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Invoice checkout session created successfully',
    data: result,
  })
})

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const filterables = pick(req.query, paymentFilterables)
  const pagination = pick(req.query, paginationFields)

  const result = await PaymentService.getAllPayments(filterables, pagination)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Payments retrieved successfully',
    data: result,
  })
})

export const PaymentController = {
  createBookingFeeSession,
  createServiceChargeSession,
  createInvoiceSession,
  getAllPayments,
}
