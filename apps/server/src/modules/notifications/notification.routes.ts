import { Router } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import { sendSuccess } from '../../utils/response';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { prisma } from '../../prisma/client';
import { AuthRequest } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const customerId = req.user!.customerId;
  if (!customerId) return sendSuccess(res, []);
  const notifs = await prisma.notification.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  sendSuccess(res, notifs);
}));

router.patch('/:id/read', asyncHandler(async (req: AuthRequest, res) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, customerId: req.user!.customerId ?? '' },
    data: { isRead: true },
  });
  sendSuccess(res, null, 'Marked as read');
}));

router.patch('/read-all', asyncHandler(async (req: AuthRequest, res) => {
  if (!req.user!.customerId) return sendSuccess(res, null);
  await prisma.notification.updateMany({
    where: { customerId: req.user!.customerId },
    data: { isRead: true },
  });
  sendSuccess(res, null, 'All marked as read');
}));

router.post('/broadcast', authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { title, body, customerIds } = req.body;
  const ids: string[] = customerIds ?? (await prisma.customer.findMany({ select: { id: true } })).map((c) => c.id);
  await prisma.notification.createMany({
    data: ids.map((customerId) => ({ customerId, title, body, type: 'ANNOUNCEMENT' })),
  });
  sendSuccess(res, null, `Sent to ${ids.length} customers`);
}));

export default router;
