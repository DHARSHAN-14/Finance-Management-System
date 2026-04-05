import { ChitStatus, ChitAuctionStatus } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { AppError } from '../../middleware/error.middleware';
import { CreateChitInput, AddMemberInput } from './chit.schema';
import { getPaginationParams, paginate } from '../../utils/response';

export const chitService = {
  async list(query: any) {
    const { page, limit, skip } = getPaginationParams(query);
    const where: any = query.status ? { status: query.status } : {};

    const [chits, total] = await Promise.all([
      prisma.chit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { members: true, installments: true } },
        },
      }),
      prisma.chit.count({ where }),
    ]);

    return { chits, pagination: paginate(page, limit, total) };
  },

  async findById(id: string) {
    const chit = await prisma.chit.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            customer: { select: { id: true, name: true, phone: true } },
          },
          orderBy: { ticketNo: 'asc' },
        },
        installments: {
          orderBy: { installmentNo: 'asc' },
          include: {
            payments: {
              include: {
                chitMember: { include: { customer: { select: { id: true, name: true } } } },
              },
            },
          },
        },
      },
    });
    if (!chit) throw new AppError('Chit not found', 404);
    return chit;
  },

  async create(data: CreateChitInput) {
    return prisma.$transaction(async (tx) => {
      const chit = await tx.chit.create({
        data: {
          name: data.name,
          totalValue: data.totalValue,
          monthlyContribution: data.monthlyContribution,
          duration: data.duration,
          commissionPct: data.commissionPct ?? 5,
          description: data.description,
          status: data.startDate ? ChitStatus.ACTIVE : ChitStatus.UPCOMING,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
        },
      });

      // Pre-create installment slots
      const startDate = data.startDate ? new Date(data.startDate) : new Date();
      for (let i = 1; i <= data.duration; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i - 1);
        await tx.chitInstallment.create({
          data: {
            chitId: chit.id,
            installmentNo: i,
            dueDate,
          },
        });
      }

      return chit;
    });
  },

  async addMember(chitId: string, data: AddMemberInput) {
    const chit = await prisma.chit.findUnique({ where: { id: chitId } });
    if (!chit) throw new AppError('Chit not found', 404);
    if (chit.status === ChitStatus.COMPLETED || chit.status === ChitStatus.CANCELLED) {
      throw new AppError('Cannot add member to closed chit', 400);
    }

    const existing = await prisma.chitMember.findUnique({
      where: { chitId_customerId: { chitId, customerId: data.customerId } },
    });
    if (existing) throw new AppError('Customer already a member of this chit', 409);

    const ticketTaken = await prisma.chitMember.findUnique({
      where: { chitId_ticketNo: { chitId, ticketNo: data.ticketNo } },
    });
    if (ticketTaken) throw new AppError('Ticket number already taken', 409);

    return prisma.chitMember.create({
      data: { chitId, customerId: data.customerId, ticketNo: data.ticketNo },
      include: { customer: { select: { id: true, name: true, phone: true } } },
    });
  },

  async removeMember(chitId: string, memberId: string) {
    const member = await prisma.chitMember.findFirst({
      where: { id: memberId, chitId },
    });
    if (!member) throw new AppError('Member not found', 404);
    if (member.hasReceived) throw new AppError('Cannot remove member who has received chit', 400);

    await prisma.chitMember.delete({ where: { id: memberId } });
  },

  async recordInstallmentPayment(chitId: string, installmentNo: number, data: any) {
    const installment = await prisma.chitInstallment.findUnique({
      where: { chitId_installmentNo: { chitId, installmentNo } },
    });
    if (!installment) throw new AppError('Installment not found', 404);

    const member = await prisma.chitMember.findUnique({ where: { id: data.chitMemberId } });
    if (!member || member.chitId !== chitId) throw new AppError('Member not part of this chit', 400);

    const existing = await prisma.chitInstallmentPayment.findFirst({
      where: { chitInstallmentId: installment.id, chitMemberId: data.chitMemberId },
    });
    if (existing) throw new AppError('Member already paid this installment', 409);

    return prisma.chitInstallmentPayment.create({
      data: {
        chitInstallmentId: installment.id,
        chitMemberId: data.chitMemberId,
        amount: data.amount,
        paidDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        paymentId: data.paymentId,
      },
    });
  },

  async conductAuction(chitId: string, installmentNo: number, data: any) {
    const installment = await prisma.chitInstallment.findUnique({
      where: { chitId_installmentNo: { chitId, installmentNo } },
    });
    if (!installment) throw new AppError('Installment not found', 404);
    if (installment.auctionStatus === ChitAuctionStatus.COMPLETED) {
      throw new AppError('Auction already completed', 400);
    }

    const member = await prisma.chitMember.findFirst({
      where: { id: data.winnerId, chitId },
    });
    if (!member) throw new AppError('Winner must be a chit member', 400);
    if (member.hasReceived) throw new AppError('Member has already received chit amount', 400);

    return prisma.$transaction(async (tx) => {
      await tx.chitInstallment.update({
        where: { id: installment.id },
        data: {
          winnerId: data.winnerId,
          auctionAmount: data.auctionAmount,
          auctionDate: data.auctionDate ? new Date(data.auctionDate) : new Date(),
          auctionStatus: ChitAuctionStatus.COMPLETED,
        },
      });

      await tx.chitMember.update({
        where: { id: data.winnerId },
        data: {
          hasReceived: true,
          receivedAt: new Date(),
          receivedAmount: data.auctionAmount,
        },
      });

      return installment;
    });
  },

  async activate(id: string) {
    return prisma.chit.update({ where: { id }, data: { status: ChitStatus.ACTIVE, startDate: new Date() } });
  },

  async complete(id: string) {
    return prisma.chit.update({ where: { id }, data: { status: ChitStatus.COMPLETED, endDate: new Date() } });
  },

  async getMyChits(customerId: string) {
    return prisma.chitMember.findMany({
      where: { customerId },
      include: {
        chit: {
          include: { _count: { select: { members: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
