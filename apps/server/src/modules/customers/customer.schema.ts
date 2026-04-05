import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15),
  address: z.string().optional(),
  aadhaarNo: z.string().optional(),
  panNo: z.string().optional(),
  occupation: z.string().optional(),
  monthlyIncome: z.number().positive().optional(),
  photoUrl: z.string().url().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
