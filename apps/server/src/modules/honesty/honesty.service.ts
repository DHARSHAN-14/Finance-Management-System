import { prisma } from '../../prisma/client';
import { AppError } from '../../middleware/error.middleware';
import { calculateHonestyScore } from '../../utils/finance';

export const honestyService = {
  async getScore(customerId: string) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new AppError('Customer not found', 404);

    const installments = await prisma.loanInstallment.findMany({
      where: { loan: { customerId } },
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

    // Bonus: active chit member with no missed payments
    const activeChits = await prisma.chitMember.count({ where: { customerId, chit: { status: 'ACTIVE' } } });
    const bonus = activeChits > 0 ? 5 : 0;

    const { score, category } = calculateHonestyScore(onTime, late, missed, bonus);

    const latest = await prisma.honestyScoreSnapshot.findFirst({
      where: { customerId },
      orderBy: { snapshotDate: 'desc' },
    });

    return {
      customerId,
      customerName: customer.name,
      score,
      category,
      onTimePayments: onTime,
      latePayments: late,
      missedPayments: missed,
      bonus,
      totalInstallments: installments.length,
      lastSnapshot: latest,
    };
  },

  async saveSnapshot(customerId: string) {
    const data = await this.getScore(customerId);
    return prisma.honestyScoreSnapshot.create({
      data: {
        customerId,
        score: data.score,
        category: data.category,
        onTimePayments: data.onTimePayments,
        latePayments: data.latePayments,
        missedPayments: data.missedPayments,
        bonus: data.bonus,
      },
    });
  },

  async getHistory(customerId: string) {
    return prisma.honestyScoreSnapshot.findMany({
      where: { customerId },
      orderBy: { snapshotDate: 'desc' },
      take: 12,
    });
  },

  async getLeaderboard() {
    const customers = await prisma.customer.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        phone: true,
        honestyScores: {
          orderBy: { snapshotDate: 'desc' },
          take: 1,
          select: { score: true, category: true, snapshotDate: true },
        },
      },
    });

    return customers
      .filter((c) => c.honestyScores.length > 0)
      .map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        score: c.honestyScores[0].score,
        category: c.honestyScores[0].category,
        lastUpdated: c.honestyScores[0].snapshotDate,
      }))
      .sort((a, b) => b.score - a.score);
  },

  async getSuggestions(customerId: string) {
    const score = await this.getScore(customerId);
    const suggestions: string[] = [];

    if (score.missedPayments > 0) {
      suggestions.push(`You have ${score.missedPayments} missed payment(s). Clearing them will significantly boost your score.`);
    }
    if (score.latePayments > 2) {
      suggestions.push('Paying on or before the due date avoids late deductions and improves trust.');
    }
    if (score.score < 60) {
      suggestions.push('Your score is below average. Consistent on-time payments over the next 3 months can bring you to Trustworthy status.');
    }
    if (score.score >= 80) {
      suggestions.push('Excellent score! You are eligible for higher loan limits and priority chit allocation.');
    }
    if (score.bonus === 0) {
      suggestions.push('Join an active chit fund to earn bonus points on your honesty score.');
    }
    if (suggestions.length === 0) {
      suggestions.push('Keep up the good work! Continue paying on time to maintain your score.');
    }

    return { score, suggestions };
  },
};
