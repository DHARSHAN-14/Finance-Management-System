import { Response } from 'express';
import { dashboardService } from './dashboard.service';
import { asyncHandler } from '../../middleware/error.middleware';
import { sendSuccess } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';

export const dashboardController = {
  summary: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.user!.role === 'CLIENT') {
      if (!req.user!.customerId) return sendSuccess(res, {});
      const data = await dashboardService.getClientDashboard(req.user!.customerId);
      return sendSuccess(res, data);
    }
    const data = await dashboardService.getAdminSummary();
    sendSuccess(res, data);
  }),

  activity: asyncHandler(async (_req: AuthRequest, res: Response) => {
    const data = await dashboardService.getRecentActivity();
    sendSuccess(res, data);
  }),

  monthlyChart: asyncHandler(async (_req: AuthRequest, res: Response) => {
    const data = await dashboardService.getMonthlyCollectionChart();
    sendSuccess(res, data);
  }),
};
