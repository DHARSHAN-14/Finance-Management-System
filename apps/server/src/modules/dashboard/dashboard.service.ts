import { prisma } from '../../prisma/client';

export const dashboardService = {
  async getAdminSummary() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCustomers,
      activeCustomers,
      activeLoans,
      totalDisbursed,
      overdueInstallments,
      activeChits,
      paymentsThisMonth,
      totalPayments,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { isActive: true } }),
      prisma.loan.count({ where: { status: { in: ['ACTIVE', 'DISBURSED'] } } }),
      prisma.loan.aggregate({
        where: { status: { in: ['ACTIVE', 'DISBURSED', 'CLOSED'] } },
        _sum: { disbursedAmount: true },
      }),
      prisma.loanInstallment.findMany({
        where: { status: 'OVERDUE' },
        select: { totalAmount: true, paidAmount: true },
      }),
      prisma.chit.count({ where: { status: 'ACTIVE' } }),
      prisma.payment.aggregate({
        where: { paymentDate: { gte: startOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
    ]);

    const overdueAmount = overdueInstallments.reduce(
      (sum, i) => sum + (i.totalAmount - i.paidAmount), 0
    );

    const totalDisbursedVal = totalDisbursed._sum.disbursedAmount ?? 0;
    const totalCollected = totalPayments._sum.amount ?? 0;

    return {
      totalCustomers,
      activeCustomers,
      activeLoans,
      activeChits,
      totalDisbursed: totalDisbursedVal,
      totalCollected,
      overdueAmount,
      overdueCount: overdueInstallments.length,
      collectionRate: totalDisbursedVal > 0
        ? Math.round((totalCollected / totalDisbursedVal) * 100 * 10) / 10
        : 0,
      thisMonthCollection: paymentsThisMonth._sum.amount ?? 0,
      thisMonthPaymentCount: paymentsThisMonth._count,
    };
  },

  async getRecentActivity() {
    const [recentPayments, recentLoans, overdueLoans] = await Promise.all([
      prisma.payment.findMany({
        take: 10,
        orderBy: { paymentDate: 'desc' },
        include: { customer: { select: { name: true, phone: true } } },
      }),
      prisma.loan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true } } },
        select: {
          id: true, loanNo: true, principalAmount: true, status: true,
          createdAt: true, customer: true,
        },
      }),
      prisma.loan.findMany({
        where: { status: 'ACTIVE', installments: { some: { status: 'OVERDUE' } } },
        take: 5,
        include: {
          customer: { select: { name: true, phone: true } },
          installments: { where: { status: 'OVERDUE' }, orderBy: { dueDate: 'asc' }, take: 1 },
        },
      }),
    ]);

    return { recentPayments, recentLoans, overdueLoans };
  },

  async getMonthlyCollectionChart() {
    const months = 12;
    const result = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      const agg = await prisma.payment.aggregate({
        where: { paymentDate: { gte: start, lte: end } },
        _sum: { amount: true },
        _count: true,
      });

      result.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        amount: agg._sum.amount ?? 0,
        count: agg._count,
      });
    }

    return result;
  },

  async getClientDashboard(customerId: string) {
    const [loans, chitMemberships, payments, honestyScore] = await Promise.all([
      prisma.loan.findMany({
        where: { customerId, status: { in: ['ACTIVE', 'DISBURSED'] } },
        include: {
          installments: {
            where: { status: { in: ['PENDING', 'OVERDUE'] } },
            orderBy: { dueDate: 'asc' },
            take: 3,
          },
        },
      }),
      prisma.chitMember.findMany({
        where: { customerId },
        include: { chit: { select: { id: true, name: true, status: true, monthlyContribution: true } } },
      }),
      prisma.payment.findMany({
        where: { customerId },
        orderBy: { paymentDate: 'desc' },
        take: 5,
      }),
      prisma.honestyScoreSnapshot.findFirst({
        where: { customerId },
        orderBy: { snapshotDate: 'desc' },
      }),
    ]);

    const totalDue = loans.reduce((sum, loan) =>
      sum + loan.installments.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0), 0
    );

    const nextDue = loans
      .flatMap((l) => l.installments)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

    return {
      activeLoans: loans.length,
      activeChits: chitMemberships.filter((m) => m.chit.status === 'ACTIVE').length,
      totalDue,
      nextDue,
      recentPayments: payments,
      honestyScore,
    };
  },
};
