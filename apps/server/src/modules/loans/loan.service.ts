import { LoanStatus, InstallmentStatus } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { AppError } from '../../middleware/error.middleware';
import { CreateLoanInput, DisburseLoanInput } from './loan.schema';
import { calculateEMI, generateAmortizationSchedule, generateLoanNo } from '../../utils/finance';
import { getPaginationParams, paginate } from '../../utils/response';

export const loanService = {
  async list(query: any, userId: string, role: string) {
    const { page, limit, skip } = getPaginationParams(query);

    const where: any = {
      ...(query.customerId && { customerId: query.customerId }),
    };

    // Special "OVERDUE" filter: overdue is tracked on installments, not loan.status
    if (query.status === 'OVERDUE') {
      where.installments = { some: { status: InstallmentStatus.OVERDUE } };
    } else if (query.status) {
      where.status = query.status;
    }

    // Clients see only their own loans
    if (role === 'CLIENT') {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { customerId: true } });
      if (!user?.customerId) return { loans: [], pagination: paginate(page, limit, 0) };
      where.customerId = user.customerId;
    }

    if (query.search) {
      where.OR = [
        { loanNo: { contains: query.search, mode: 'insensitive' } },
        { customer: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          _count: { select: { installments: true } },
        },
      }),
      prisma.loan.count({ where }),
    ]);

    return { loans, pagination: paginate(page, limit, total) };
  },

  async findById(id: string) {
    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        installments: { orderBy: { installmentNo: 'asc' } },
      },
    });
    if (!loan) throw new AppError('Loan not found', 404);
    return loan;
  },

  async create(data: CreateLoanInput, createdBy: string) {
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer || !customer.isActive) throw new AppError('Customer not found or inactive', 404);

    const count = await prisma.loan.count();
    const loanNo = generateLoanNo(count);
    const emi = calculateEMI(data.principalAmount, data.interestRate, data.tenure);

    return prisma.loan.create({
      data: {
        customerId: data.customerId,
        loanNo,
        principalAmount: data.principalAmount,
        interestRate: data.interestRate,
        tenure: data.tenure,
        emi,
        processingFee: data.processingFee ?? 0,
        purpose: data.purpose,
        status: LoanStatus.PENDING,
      },
      include: { customer: { select: { id: true, name: true, phone: true } } },
    });
  },

  async approve(id: string, approvedBy: string) {
    const loan = await this.findById(id);
    if (loan.status !== LoanStatus.PENDING) throw new AppError('Loan is not in PENDING status', 400);

    return prisma.loan.update({
      where: { id },
      data: {
        status: LoanStatus.APPROVED,
        approvedBy,
        approvedAt: new Date(),
      },
    });
  },

  async reject(id: string) {
    const loan = await this.findById(id);
    if (loan.status !== LoanStatus.PENDING) throw new AppError('Only pending loans can be rejected', 400);
    return prisma.loan.update({ where: { id }, data: { status: LoanStatus.REJECTED } });
  },

  async disburse(id: string, data: DisburseLoanInput, disbursedBy: string) {
    const loan = await this.findById(id);
    if (loan.status !== LoanStatus.APPROVED) throw new AppError('Loan must be approved before disbursement', 400);

    const startDate = new Date(data.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + loan.tenure - 1);

    const schedule = generateAmortizationSchedule(
      data.disbursedAmount,
      loan.interestRate,
      loan.tenure,
      startDate
    );

    await prisma.$transaction(async (tx) => {
      await tx.loan.update({
        where: { id },
        data: {
          status: LoanStatus.ACTIVE,
          disbursedAmount: data.disbursedAmount,
          startDate,
          endDate,
          disbursedAt: new Date(),
          // Recalculate EMI on disbursed amount
          emi: calculateEMI(data.disbursedAmount, loan.interestRate, loan.tenure),
        },
      });

      await tx.loanInstallment.createMany({
        data: schedule.map((row) => ({
          loanId: id,
          installmentNo: row.installmentNo,
          dueDate: row.dueDate,
          principalAmount: row.principal,
          interestAmount: row.interest,
          totalAmount: row.totalAmount,
          status: InstallmentStatus.PENDING,
        })),
      });
    });

    return this.findById(id);
  },

  async close(id: string) {
    const loan = await this.findById(id);
    if (!['ACTIVE', 'DISBURSED'].includes(loan.status)) throw new AppError('Loan cannot be closed', 400);
    return prisma.loan.update({ where: { id }, data: { status: LoanStatus.CLOSED } });
  },

  async markOverdue() {
    const now = new Date();
    const updated = await prisma.loanInstallment.updateMany({
      where: {
        status: InstallmentStatus.PENDING,
        dueDate: { lt: now },
      },
      data: { status: InstallmentStatus.OVERDUE },
    });
    return updated.count;
  },

  async getSchedule(id: string) {
    const loan = await this.findById(id);
    return loan.installments;
  },

  async getOverdueLoans() {
    return prisma.loan.findMany({
      where: {
        status: LoanStatus.ACTIVE,
        installments: { some: { status: InstallmentStatus.OVERDUE } },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        installments: {
          where: { status: InstallmentStatus.OVERDUE },
          orderBy: { dueDate: 'asc' },
        },
      },
    });
  },

  async calculateEMIPreview(principal: number, rate: number, tenure: number) {
    const emi = calculateEMI(principal, rate, tenure);
    const schedule = generateAmortizationSchedule(principal, rate, tenure, new Date());
    const totalPayable = schedule.reduce((s, r) => s + r.totalAmount, 0);
    const totalInterest = totalPayable - principal;

    return { emi, totalPayable, totalInterest, schedule };
  },
};
