import { Response } from 'express';
import { paymentService } from './payment.service';
import { asyncHandler } from '../../middleware/error.middleware';
import { sendSuccess } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';

export const paymentController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await paymentService.list(req.query, req.user!.userId, req.user!.role);
    sendSuccess(res, result.payments, 'Payments fetched', 200, result.pagination);
  }),

  findById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const payment = await paymentService.findById(req.params.id);
    sendSuccess(res, payment);
  }),

  record: asyncHandler(async (req: AuthRequest, res: Response) => {
    const payment = await paymentService.record(req.body, req.user!.userId);
    sendSuccess(res, payment, 'Payment recorded successfully', 201);
  }),

  getSummary: asyncHandler(async (req: AuthRequest, res: Response) => {
    const summary = await paymentService.getSummary(req.params.customerId);
    sendSuccess(res, summary);
  }),
};
