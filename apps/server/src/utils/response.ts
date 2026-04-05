import { Response } from 'express';

export const sendSuccess = (
  res: Response,
  data: any,
  message = 'Success',
  status = 200,
  pagination?: any
) => {
  return res.status(status).json({
    success: true,
    message,
    data,
    ...(pagination && { pagination }),
  });
};

export const sendError = (
  res: Response,
  message = 'Internal Server Error',
  status = 500,
  errors?: any
) => {
  return res.status(status).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};

export const paginate = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

export const getPaginationParams = (query: any) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
