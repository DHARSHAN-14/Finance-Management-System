import { Response } from 'express';
import { chitService } from './chit.service';
import { asyncHandler } from '../../middleware/error.middleware';
import { sendSuccess } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';

export const chitController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await chitService.list(req.query);
    sendSuccess(res, result.chits, 'Chits fetched', 200, result.pagination);
  }),

  findById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const chit = await chitService.findById(req.params.id);
    sendSuccess(res, chit);
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const chit = await chitService.create(req.body);
    sendSuccess(res, chit, 'Chit created', 201);
  }),

  addMember: asyncHandler(async (req: AuthRequest, res: Response) => {
    const member = await chitService.addMember(req.params.id, req.body);
    sendSuccess(res, member, 'Member added', 201);
  }),

  removeMember: asyncHandler(async (req: AuthRequest, res: Response) => {
    await chitService.removeMember(req.params.id, req.params.memberId);
    sendSuccess(res, null, 'Member removed');
  }),

  recordPayment: asyncHandler(async (req: AuthRequest, res: Response) => {
    const payment = await chitService.recordInstallmentPayment(
      req.params.id,
      parseInt(req.params.installmentNo),
      req.body
    );
    sendSuccess(res, payment, 'Payment recorded', 201);
  }),

  conductAuction: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await chitService.conductAuction(
      req.params.id,
      parseInt(req.params.installmentNo),
      req.body
    );
    sendSuccess(res, result, 'Auction completed');
  }),

  activate: asyncHandler(async (req: AuthRequest, res: Response) => {
    const chit = await chitService.activate(req.params.id);
    sendSuccess(res, chit, 'Chit activated');
  }),

  complete: asyncHandler(async (req: AuthRequest, res: Response) => {
    const chit = await chitService.complete(req.params.id);
    sendSuccess(res, chit, 'Chit marked complete');
  }),

  myChits: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user!.customerId) return sendSuccess(res, []);
    const chits = await chitService.getMyChits(req.user!.customerId);
    sendSuccess(res, chits);
  }),
};
