import { Response, Router } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import { sendSuccess } from '../../utils/response';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { prisma } from '../../prisma/client';
import { AuthRequest } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' });
}

async function createNotificationOnce(input: {
  customerId: string;
  type: string;
  title: string;
  body: string;
  dedupeHours?: number;
}) {
  const dedupeHours = input.dedupeHours ?? 72;
  const since = new Date(Date.now() - dedupeHours * 60 * 60 * 1000);
  const existing = await prisma.notification.findFirst({
    where: {
      customerId: input.customerId,
      type: input.type,
      title: input.title,
      body: input.body,
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  if (existing) return;
  await prisma.notification.create({
    data: {
      customerId: input.customerId,
      type: input.type,
      title: input.title,
      body: input.body,
    },
  });
}

async function syncDueNotifications(customerId: string) {
  const now = new Date();
  const upcomingWindowDays = 7;
  const upcomingUntil = new Date(now);
  upcomingUntil.setDate(upcomingUntil.getDate() + upcomingWindowDays);

  // 1) Loans: mark crossed installments overdue
  await prisma.loanInstallment.updateMany({
    where: {
      status: 'PENDING',
      dueDate: { lt: now },
      loan: { customerId },
    },
    data: { status: 'OVERDUE' },
  });

  // 2) Loans: upcoming due + overdue
  const [upcomingLoanInst, overdueLoanInst] = await Promise.all([
    prisma.loanInstallment.findMany({
      where: {
        loan: { customerId },
        status: 'PENDING',
        dueDate: { gte: now, lte: upcomingUntil },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
      include: { loan: { select: { loanNo: true } } },
    }),
    prisma.loanInstallment.findMany({
      where: {
        loan: { customerId },
        status: 'OVERDUE',
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
      include: { loan: { select: { loanNo: true } } },
    }),
  ]);

  for (const inst of upcomingLoanInst) {
    await createNotificationOnce({
      customerId,
      type: 'WARNING',
      title: 'Loan EMI due soon',
      body: `Loan ${inst.loan.loanNo} installment #${inst.installmentNo} is due on ${fmtDate(inst.dueDate)}.`,
      dedupeHours: 48,
    });
  }

  for (const inst of overdueLoanInst) {
    await createNotificationOnce({
      customerId,
      type: 'DANGER',
      title: 'Loan EMI overdue',
      body: `Loan ${inst.loan.loanNo} installment #${inst.installmentNo} was due on ${fmtDate(inst.dueDate)} and is now overdue.`,
      dedupeHours: 48,
    });
  }

  // 3) Chits: upcoming/overdue per customer membership payment
  const members = await prisma.chitMember.findMany({
    where: { customerId },
    select: { id: true, chitId: true, chit: { select: { name: true } } },
  });
  if (members.length === 0) return;

  const memberByChitId = new Map<string, { memberId: string; chitName: string }>();
  for (const m of members) memberByChitId.set(m.chitId, { memberId: m.id, chitName: m.chit.name });

  const chitIds = members.map((m) => m.chitId);
  const installments = await prisma.chitInstallment.findMany({
    where: {
      chitId: { in: chitIds },
      dueDate: { lte: upcomingUntil },
    },
    orderBy: { dueDate: 'asc' },
    take: 25,
    include: {
      payments: {
        select: { chitMemberId: true },
      },
      chit: { select: { name: true } },
    },
  });

  for (const inst of installments) {
    const member = memberByChitId.get(inst.chitId);
    if (!member) continue;
    const paid = inst.payments.some((p) => p.chitMemberId === member.memberId);
    if (paid) continue;

    const isOverdue = inst.dueDate < now;
    await createNotificationOnce({
      customerId,
      type: isOverdue ? 'DANGER' : 'WARNING',
      title: isOverdue ? 'Chit payment overdue' : 'Chit payment due soon',
      body: `${inst.chit.name} installment #${inst.installmentNo} is ${isOverdue ? 'overdue (was due' : 'due'} on ${fmtDate(inst.dueDate)}.`,
      dedupeHours: 48,
    });
  }
}

router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const customerId = req.user!.customerId;
  if (!customerId) return sendSuccess(res, []);
  await syncDueNotifications(customerId);
  const notifs = await prisma.notification.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  sendSuccess(res, notifs);
}));

router.patch('/:id/read', asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, customerId: req.user!.customerId ?? '' },
    data: { isRead: true },
  });
  sendSuccess(res, null, 'Marked as read');
}));

router.patch('/read-all', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user!.customerId) return sendSuccess(res, null);
  await prisma.notification.updateMany({
    where: { customerId: req.user!.customerId },
    data: { isRead: true },
  });
  sendSuccess(res, null, 'All marked as read');
}));

router.post('/broadcast', authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, body, customerIds } = req.body;
  const ids: string[] = customerIds ?? (await prisma.customer.findMany({ select: { id: true } })).map((c) => c.id);
  await prisma.notification.createMany({
    data: ids.map((customerId) => ({ customerId, title, body, type: 'ANNOUNCEMENT' })),
  });
  sendSuccess(res, null, `Sent to ${ids.length} customers`);
}));

export default router;
