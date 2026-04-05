import { prisma } from '../../prisma/client';
import { AppError } from '../../middleware/error.middleware';
import { CreateCustomerInput, UpdateCustomerInput } from './customer.schema';
import { getPaginationParams, paginate } from '../../utils/response';
import { calculateHonestyScore } from '../../utils/finance';

export const customerService = {
  async list(query: any) {
    const { page, limit, skip } = getPaginationParams(query);
    const search = query.search as string | undefined;
    const isActive = query.isActive === 'false' ? false : query.isActive === 'true' ? true : undefined;

    const where: any = {
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          honestyScores: {
            orderBy: { snapshotDate: 'desc' },
            take: 1,
            select: { score: true, category: true },
          },
          _count: { select: { loans: true, chitMembers: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return { customers, pagination: paginate(page, limit, total) };
  },

  async findById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        loans: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, loanNo: true, principalAmount: true, emi: true,
            status: true, startDate: true, endDate: true,
          },
        },
        chitMembers: {
          include: {
            chit: { select: { id: true, name: true, status: true, monthlyContribution: true } },
          },
        },
        honestyScores: {
          orderBy: { snapshotDate: 'desc' },
          take: 5,
        },
        _count: { select: { loans: true, chitMembers: true, payments: true } },
      },
    });
    if (!customer) throw new AppError('Customer not found', 404);
    return customer;
  },

  async create(data: CreateCustomerInput) {
    const existing = await prisma.customer.findUnique({ where: { phone: data.phone } });
    if (existing) throw new AppError('Phone number already registered', 409);

    return prisma.customer.create({ data });
  },

  async update(id: string, data: UpdateCustomerInput) {
    await this.findById(id);

    if (data.phone) {
      const existing = await prisma.customer.findFirst({
        where: { phone: data.phone, id: { not: id } },
      });
      if (existing) throw new AppError('Phone number already in use', 409);
    }

    return prisma.customer.update({ where: { id }, data });
  },

  async deactivate(id: string) {
    await this.findById(id);
    return prisma.customer.update({ where: { id }, data: { isActive: false } });
  },

  async activate(id: string) {
    return prisma.customer.update({ where: { id }, data: { isActive: true } });
  },

  async getStats(id: string) {
    await this.findById(id);

    const [loans, payments, chitMemberships] = await Promise.all([
      prisma.loan.findMany({
        where: { customerId: id },
        include: { installments: true },
      }),
      prisma.payment.findMany({ where: { customerId: id } }),
      prisma.chitMember.findMany({
        where: { customerId: id },
        include: { chit: true },
      }),
    ]);

    const activeLoans = loans.filter((l) => l.status === 'ACTIVE' || l.status === 'DISBURSED');
    const totalDue = loans.reduce((sum, l) =>
      sum + l.installments.filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE')
        .reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0), 0);
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

    return {
      totalLoans: loans.length,
      activeLoans: activeLoans.length,
      totalChits: chitMemberships.length,
      totalPaid,
      totalDue,
      paymentCount: payments.length,
    };
  },

  async refreshHonestyScore(id: string) {
    await this.findById(id);

    const installments = await prisma.loanInstallment.findMany({
      where: { loan: { customerId: id } },
    });

    let onTime = 0, late = 0, missed = 0;
    const now = new Date();

    for (const inst of installments) {
      if (inst.status === 'PAID') {
        if (inst.paidDate && inst.paidDate <= inst.dueDate) onTime++;
        else late++;
      } else if (inst.status === 'OVERDUE' || (inst.status === 'PENDING' && inst.dueDate < now)) {
        missed++;
      }
    }

    const { score, category } = calculateHonestyScore(onTime, late, missed);

    return prisma.honestyScoreSnapshot.create({
      data: {
        customerId: id,
        score,
        category,
        onTimePayments: onTime,
        latePayments: late,
        missedPayments: missed,
      },
    });
  },
};
