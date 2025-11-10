import { Request, Response } from 'express';
import { ServiceServices } from './service.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import pick from '../../../shared/pick';
import { serviceFilterables } from './service.constants';
import { paginationFields } from '../../../interfaces/pagination';

const createService = catchAsync(async (req: Request, res: Response) => {
  const serviceData = req.body;

  const result = await ServiceServices.createService(
    req.user!,
    serviceData
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Service created successfully',
    data: result,
  });
});

const updateService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const serviceData = req.body;

  const result = await ServiceServices.updateService(id, serviceData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Service updated successfully',
    data: result,
  });
});

const getSingleService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ServiceServices.getSingleService(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Service retrieved successfully',
    data: result,
  });
});

const getAllServices = catchAsync(async (req: Request, res: Response) => {
  const filterables = pick(req.query, serviceFilterables);
  const pagination = pick(req.query, paginationFields);

  const result = await ServiceServices.getAllServices(
    req.user!,
    filterables,
    pagination
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Services retrieved successfully',
    data: result,
  });
});

const deleteService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ServiceServices.deleteService(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Service deleted successfully',
    data: result,
  });
});

export const ServiceController = {
  createService,
  updateService,
  getSingleService,
  getAllServices,
  deleteService,
};