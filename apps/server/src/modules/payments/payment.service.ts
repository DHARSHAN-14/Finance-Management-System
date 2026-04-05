import { InstallmentStatus } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { AppError } from '../../middleware/error.middleware';
import { RecordPaymentInput } from './payment.schema';
import { getPaginationParams, paginate } from '../../utils/response';
import { generatePaymentNo } from '../../utils/finance';

export const paymentService = {
  async list(query: any, userId: string, role: string) {
    const { page, limit, skip } = getPaginationParams(query);

    const where: any = {};

    if (role === 'CLIENT') {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { customerId: true } });
      if (!user?.customerId) return { payments: [], pagination: paginate(page, limit, 0) };
      where.customerId = user.customerId;
    } else {
      if (query.customerId) where.customerId = query.customerId;
    }

    if (query.method) where.method = query.method;
    if (query.from || query.to) {
      where.paymentDate = {
        ...(query.from && { gte: new Date(query.from) }),
        ...(query.to && { lte: new Date(query.to) }),
      };
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paymentDate: 'desc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          allocations: {
            include: {
              loan: { select: { loanNo: true } },
              installment: { select: { installmentNo: true, dueDate: true } },
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return { payments, pagination: paginate(page, limit, total) };
  },

  async findById(id: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        allocations: {
          include: {
            loan: { select: { loanNo: true } },
            installment: { select: { installmentNo: true, dueDate: true, totalAmount: true } },
          },
        },
      },
    });
    if (!payment) throw new AppError('Payment not found', 404);
    return payment;
  },

  async record(data: RecordPaymentInput, collectedBy: string) {
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) throw new AppError('Customer not found', 404);

    const count = await prisma.payment.count();
    const paymentNo = generatePaymentNo(count);

    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          customerId: data.customerId,
          paymentNo,
          amount: data.amount,
          method: data.method ?? 'CASH',
          referenceNo: data.referenceNo,
          notes: data.notes,
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
          collectedBy,
        },
      });

      // Auto-allocate to pending/overdue installments if no explicit allocations
      const allocations = data.allocations ?? await this._autoAllocate(data.customerId, data.amount, tx);

      for (const alloc of allocations) {
        await tx.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            loanId: alloc.loanId,
            installmentId: alloc.installmentId,
            amount: alloc.amount,
          },
        });

        const inst = await tx.loanInstallment.findUnique({ where: { id: alloc.installmentId } });
        if (!inst) continue;

        const newPaid = inst.paidAmount + alloc.amount;
        const isFullyPaid = newPaid >= inst.totalAmount - 0.01;

        await tx.loanInstallment.update({
          where: { id: alloc.installmentId },
          data: {
            paidAmount: newPaid,
            status: isFullyPaid ? InstallmentStatus.PAID : InstallmentStatus.PARTIAL,
            paidDate: isFullyPaid ? new Date() : undefined,
          },
        });

        // Check if loan is fully paid
        if (isFullyPaid) {
          const remaining = await tx.loanInstallment.count({
            where: {
              loanId: alloc.loanId,
              status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] },
            },
          });
          if (remaining === 0) {
            await tx.loan.update({ where: { id: alloc.loanId }, data: { status: 'CLOSED' } });
          }
        }
      }

      return payment;
    });
  },

  async _autoAllocate(customerId: string, amount: number, tx: any) {
    const pending = await tx.loanInstallment.findMany({
      where: {
        loan: { customerId, status: { in: ['ACTIVE', 'DISBURSED'] } },
        status: { in: ['OVERDUE', 'PENDING', 'PARTIAL'] },
      },
      orderBy: { dueDate: 'asc' },
    });

    const allocations: any[] = [];
    let remaining = amount;

    for (const inst of pending) {
      if (remaining <= 0) break;
      const due = inst.totalAmount - inst.paidAmount;
      const pay = Math.min(due, remaining);
      allocations.push({ loanId: inst.loanId, installmentId: inst.id, amount: pay });
      remaining -= pay;
    }

    return allocations;
  },

  async getSummary(customerId: string) {
    const payments = await prisma.payment.findMany({
      where: { customerId },
      orderBy: { paymentDate: 'desc' },
    });

    const total = payments.reduce((s, p) => s + p.amount, 0);
    const byMethod = payments.reduce((acc: any, p) => {
      acc[p.method] = (acc[p.method] || 0) + p.amount;
      return acc;
    }, {});

    return { total, count: payments.length, byMethod, recent: payments.slice(0, 5) };
  },
};
