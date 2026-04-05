import { Router } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import { sendSuccess } from '../../utils/response';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { honestyService } from './honesty.service';
import { AuthRequest } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/leaderboard', authorize('ADMIN', 'STAFF'), asyncHandler(async (_req: AuthRequest, res) => {
  const data = await honestyService.getLeaderboard();
  sendSuccess(res, data);
}));

router.get('/my-score', asyncHandler(async (req: AuthRequest, res) => {
  if (!req.user!.customerId) return sendSuccess(res, null, 'No customer linked');
  const data = await honestyService.getScore(req.user!.customerId);
  sendSuccess(res, data);
}));

router.get('/my-suggestions', asyncHandler(async (req: AuthRequest, res) => {
  if (!req.user!.customerId) return sendSuccess(res, { suggestions: [] });
  const data = await honestyService.getSuggestions(req.user!.customerId);
  sendSuccess(res, data);
}));

router.get('/:customerId', authorize('ADMIN', 'STAFF'), asyncHandler(async (req: AuthRequest, res) => {
  const data = await honestyService.getScore(req.params.customerId);
  sendSuccess(res, data);
}));

router.get('/:customerId/history', authorize('ADMIN', 'STAFF'), asyncHandler(async (req: AuthRequest, res) => {
  const data = await honestyService.getHistory(req.params.customerId);
  sendSuccess(res, data);
}));

router.post('/:customerId/snapshot', authorize('ADMIN', 'STAFF'), asyncHandler(async (req: AuthRequest, res) => {
  const snap = await honestyService.saveSnapshot(req.params.customerId);
  sendSuccess(res, snap, 'Snapshot saved');
}));

router.get('/:customerId/suggestions', authorize('ADMIN', 'STAFF'), asyncHandler(async (req: AuthRequest, res) => {
  const data = await honestyService.getSuggestions(req.params.customerId);
  sendSuccess(res, data);
}));

export default router;
