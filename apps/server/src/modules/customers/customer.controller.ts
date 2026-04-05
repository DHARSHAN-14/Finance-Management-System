import { Response } from 'express';
import { customerService } from './customer.service';
import { asyncHandler } from '../../middleware/error.middleware';
import { sendSuccess } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';

export const customerController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    // Clients can only see their own record
    if (req.user!.role === 'CLIENT') {
      if (!req.user!.customerId) return sendSuccess(res, null, 'No customer profile');
      const customer = await customerService.findById(req.user!.customerId);
      return sendSuccess(res, customer);
    }
    const result = await customerService.list(req.query);
    sendSuccess(res, result.customers, 'Customers fetched', 200, result.pagination);
  }),

  findById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = req.params.id;
    if (req.user!.role === 'CLIENT' && req.user!.customerId !== id) {
      return sendSuccess(res, null, 'Forbidden', 403);
    }
    const customer = await customerService.findById(id);
    sendSuccess(res, customer);
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const customer = await customerService.create(req.body);
    sendSuccess(res, customer, 'Customer created', 201);
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const customer = await customerService.update(req.params.id, req.body);
    sendSuccess(res, customer, 'Customer updated');
  }),

  deactivate: asyncHandler(async (req: AuthRequest, res: Response) => {
    await customerService.deactivate(req.params.id);
    sendSuccess(res, null, 'Customer deactivated');
  }),

  activate: asyncHandler(async (req: AuthRequest, res: Response) => {
    await customerService.activate(req.params.id);
    sendSuccess(res, null, 'Customer activated');
  }),

  getStats: asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await customerService.getStats(req.params.id);
    sendSuccess(res, stats);
  }),

  refreshHonestyScore: asyncHandler(async (req: AuthRequest, res: Response) => {
    const snapshot = await customerService.refreshHonestyScore(req.params.id);
    sendSuccess(res, snapshot, 'Honesty score updated');
  }),
};
