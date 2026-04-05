import { z } from 'zod';

export const recordPaymentSchema = z.object({
  customerId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE']).default('CASH'),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
  paymentDate: z.string().datetime().optional(),
  // Optional: allocate to specific loan installments
  allocations: z.array(z.object({
    loanId: z.string().uuid(),
    installmentId: z.string().uuid(),
    amount: z.number().positive(),
  })).optional(),
});

export const paymentQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  customerId: z.string().optional(),
  method: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
