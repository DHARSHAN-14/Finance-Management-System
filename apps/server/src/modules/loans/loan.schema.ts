import { z } from 'zod';

export const createLoanSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  principalAmount: z.number().positive('Principal must be positive'),
  interestRate: z.number().min(0).max(100),
  tenure: z.number().int().min(1).max(360),
  processingFee: z.number().min(0).default(0),
  purpose: z.string().optional(),
  startDate: z.string().datetime().optional(),
});

export const approveLoanSchema = z.object({
  approvedAmount: z.number().positive().optional(),
});

export const disburseLoanSchema = z.object({
  disbursedAmount: z.number().positive(),
  startDate: z.string().datetime(),
});

export const loanQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.string().optional(),
  customerId: z.string().optional(),
  search: z.string().optional(),
});

export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type DisburseLoanInput = z.infer<typeof disburseLoanSchema>;
