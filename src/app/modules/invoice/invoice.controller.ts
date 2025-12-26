import { Request, Response } from 'express'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import { InvoiceService } from './invoice.service'
import { JwtPayload } from 'jsonwebtoken'

const generateInvoices = catchAsync(async (req: Request, res: Response) => {
    const result = await InvoiceService.generateInvoices()

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Invoices generated successfully',
        data: result,
    })
})

const getMyInvoices = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload
    const result = await InvoiceService.getMyInvoices(user.authId)

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'My invoices retrieved successfully',
        data: result,
    })
})

const getAllInvoices = catchAsync(async (req: Request, res: Response) => {
    const result = await InvoiceService.getAllInvoices()

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'All invoices retrieved successfully',
        data: result,
    })
})

const getSingleInvoice = catchAsync(async (req: Request, res: Response) => {
    const result = await InvoiceService.getSingleInvoice(req.params.id)

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Invoice retrieved successfully',
        data: result,
    })
})

export const InvoiceController = {
    generateInvoices,
    getMyInvoices,
    getAllInvoices,
    getSingleInvoice,
}
