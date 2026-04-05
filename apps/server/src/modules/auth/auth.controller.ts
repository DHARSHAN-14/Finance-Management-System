import { Request, Response } from 'express';
import { authService } from './auth.service';
import { asyncHandler } from '../../middleware/error.middleware';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    sendSuccess(res, result, 'Login successful');
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const tokens = await authService.refreshToken(req.body.refreshToken);
    sendSuccess(res, tokens, 'Token refreshed');
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(req.body.refreshToken);
    sendSuccess(res, null, 'Logged out successfully');
  }),

  me: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await authService.getMe(req.user!.userId);
    sendSuccess(res, user);
  }),

  changePassword: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user!.userId, currentPassword, newPassword);
    sendSuccess(res, null, 'Password changed successfully');
  }),
};
