import { Response } from 'express';
import { loanService } from './loan.service';
import { asyncHandler } from '../../middleware/error.middleware';
import { sendSuccess } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';

export const loanController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await loanService.list(req.query, req.user!.userId, req.user!.role);
    sendSuccess(res, result.loans, 'Loans fetched', 200, result.pagination);
  }),

  findById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const loan = await loanService.findById(req.params.id);
    sendSuccess(res, loan);
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const loan = await loanService.create(req.body, req.user!.userId);
    sendSuccess(res, loan, 'Loan application created', 201);
  }),

  approve: asyncHandler(async (req: AuthRequest, res: Response) => {
    const loan = await loanService.approve(req.params.id, req.user!.userId);
    sendSuccess(res, loan, 'Loan approved');
  }),

  reject: asyncHandler(async (req: AuthRequest, res: Response) => {
    const loan = await loanService.reject(req.params.id);
    sendSuccess(res, loan, 'Loan rejected');
  }),

  disburse: asyncHandler(async (req: AuthRequest, res: Response) => {
    const loan = await loanService.disburse(req.params.id, req.body, req.user!.userId);
    sendSuccess(res, loan, 'Loan disbursed and schedule generated');
  }),

  close: asyncHandler(async (req: AuthRequest, res: Response) => {
    const loan = await loanService.close(req.params.id);
    sendSuccess(res, loan, 'Loan closed');
  }),

  getSchedule: asyncHandler(async (req: AuthRequest, res: Response) => {
    const schedule = await loanService.getSchedule(req.params.id);
    sendSuccess(res, schedule);
  }),

  getOverdue: asyncHandler(async (_req: AuthRequest, res: Response) => {
    const loans = await loanService.getOverdueLoans();
    sendSuccess(res, loans);
  }),

  markOverdue: asyncHandler(async (_req: AuthRequest, res: Response) => {
    const count = await loanService.markOverdue();
    sendSuccess(res, { updated: count }, `${count} installments marked overdue`);
  }),

  emiPreview: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { principal, rate, tenure } = req.query;
    const result = await loanService.calculateEMIPreview(
      Number(principal), Number(rate), Number(tenure)
    );
    sendSuccess(res, result);
  }),
};
