import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10).max(15),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  address: z.string().optional(),
  aadhaarNo: z.string().optional(),
  panNo: z.string().optional(),
  occupation: z.string().optional(),
  monthlyIncome: z.number().positive().optional(),
  photoUrl: z.string().url().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Must contain uppercase, lowercase and number'
  ),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
