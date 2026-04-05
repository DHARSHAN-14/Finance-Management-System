import { z } from 'zod';

export const createChitSchema = z.object({
  name: z.string().min(2),
  totalValue: z.number().positive(),
  monthlyContribution: z.number().positive(),
  duration: z.number().int().min(2).max(120),
  commissionPct: z.number().min(0).max(20).default(5),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
});

export const addMemberSchema = z.object({
  customerId: z.string().min(1),
  ticketNo: z.number().int().positive(),
});

export const recordChitPaymentSchema = z.object({
  chitMemberId: z.string().min(1),
  amount: z.number().positive(),
  paymentDate: z.string().datetime().optional(),
  paymentId: z.string().min(1).optional(),
});

export const conductAuctionSchema = z.object({
  winnerId: z.string().min(1),
  auctionAmount: z.number().positive(),
  auctionDate: z.string().datetime().optional(),
});

export type CreateChitInput = z.infer<typeof createChitSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
