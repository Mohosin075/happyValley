import { Request, Response } from 'express';
import { AgreementServices } from './agreement.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import pick from '../../../shared/pick';
import { agreementFilterables } from './agreement.constants';
import { paginationFields } from '../../../interfaces/pagination';

const createAgreement = catchAsync(async (req: Request, res: Response) => {
  const agreementData = req.body;

  const result = await AgreementServices.createAgreement(
    req.user!,
    agreementData
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Agreement created successfully',
    data: result,
  });
});

const updateAgreement = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const agreementData = req.body;

  const result = await AgreementServices.updateAgreement(id, agreementData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Agreement updated successfully',
    data: result,
  });
});

const getSingleAgreement = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AgreementServices.getSingleAgreement(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Agreement retrieved successfully',
    data: result,
  });
});

const getAllAgreements = catchAsync(async (req: Request, res: Response) => {
  const filterables = pick(req.query, agreementFilterables);
  const pagination = pick(req.query, paginationFields);

  const result = await AgreementServices.getAllAgreements(
    req.user!,
    filterables,
    pagination
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Agreements retrieved successfully',
    data: result,
  });
});

const deleteAgreement = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AgreementServices.deleteAgreement(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Agreement deleted successfully',
    data: result,
  });
});

export const AgreementController = {
  createAgreement,
  updateAgreement,
  getSingleAgreement,
  getAllAgreements,
  deleteAgreement,
};