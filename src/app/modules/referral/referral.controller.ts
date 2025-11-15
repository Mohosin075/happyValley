import { Request, Response } from 'express';
import { ReferralServices } from './referral.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import pick from '../../../shared/pick';
import { referralFilterables } from './referral.constants';
import { paginationFields } from '../../../interfaces/pagination';

const createReferral = catchAsync(async (req: Request, res: Response) => {
  const referralData = req.body;

  const result = await ReferralServices.createReferral(
    req.user!,
    referralData
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Referral created successfully',
    data: result,
  });
});

const updateReferral = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const referralData = req.body;

  const result = await ReferralServices.updateReferral(id, referralData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Referral updated successfully',
    data: result,
  });
});

const getSingleReferral = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ReferralServices.getSingleReferral(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Referral retrieved successfully',
    data: result,
  });
});

const getAllReferrals = catchAsync(async (req: Request, res: Response) => {
  const filterables = pick(req.query, referralFilterables);
  const pagination = pick(req.query, paginationFields);

  const result = await ReferralServices.getAllReferrals(
    req.user!,
    filterables,
    pagination
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Referrals retrieved successfully',
    data: result,
  });
});

const deleteReferral = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ReferralServices.deleteReferral(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Referral deleted successfully',
    data: result,
  });
});

export const ReferralController = {
  createReferral,
  updateReferral,
  getSingleReferral,
  getAllReferrals,
  deleteReferral,
};