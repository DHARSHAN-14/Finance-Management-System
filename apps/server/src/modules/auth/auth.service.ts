import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma/client';
import { AppError } from '../../middleware/error.middleware';
import { LoginInput, RegisterInput } from './auth.schema';
import { generateCustomerCode, generateUserCode } from '../../utils/codes';

const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

function generateTokens(userId: string, role: string, email: string) {
  const payload = { userId, role, email };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: ACCESS_EXPIRES as any });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: REFRESH_EXPIRES as any });
  return { accessToken, refreshToken };
}

export const authService = {
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { customer: { select: { id: true, customerCode: true, name: true, phone: true } } },
    });

    if (!user) throw new AppError('Invalid credentials', 401);
    if (!user.isActive) throw new AppError('Account pending admin approval', 403);

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) throw new AppError('Invalid credentials', 401);

    const { accessToken, refreshToken } = generateTokens(user.id, user.role, user.email);

    // Clear old refresh tokens for this user to avoid unique constraint errors
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_EXPIRES_MS),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        userCode: user.userCode,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        customerId: user.customerId,
        customer: user.customer,
      },
    };
  },

  async register(input: RegisterInput) {
    const email = input.email.trim().toLowerCase();
    const aadhaarNo = input.aadhaarNo?.trim() || undefined;
    const panNo = input.panNo?.trim() || undefined;

    const [existingUser, existingCustomer, existingAadhaar, existingPan] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.customer.findUnique({ where: { phone: input.phone } }),
      aadhaarNo ? prisma.customer.findFirst({ where: { aadhaarNo } }) : Promise.resolve(null),
      panNo ? prisma.customer.findFirst({ where: { panNo } }) : Promise.resolve(null),
    ]);

    if (existingUser) throw new AppError('Email already registered', 409);
    if (existingCustomer) throw new AppError('Phone number already registered', 409);
    if (existingAadhaar) throw new AppError('Aadhaar number already registered', 409);
    if (existingPan) throw new AppError('PAN number already registered', 409);

    const hashed = await bcrypt.hash(input.password, 12);

    const result = await prisma.$transaction(async (tx) => {
      // Retry a few times in the extremely unlikely event of code collisions.
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const customer = await tx.customer.create({
            data: {
              customerCode: generateCustomerCode(),
              name: input.name,
              email,
              phone: input.phone,
              address: input.address,
              ...(aadhaarNo ? { aadhaarNo } : {}),
              ...(panNo ? { panNo } : {}),
              occupation: input.occupation,
              monthlyIncome: input.monthlyIncome,
              photoUrl: input.photoUrl,
              isActive: false,
            },
            select: { id: true, customerCode: true, name: true, email: true, phone: true, isActive: true, createdAt: true },
          });

          await tx.user.create({
            data: {
              userCode: generateUserCode('CLIENT'),
              name: input.name,
              email,
              password: hashed,
              role: 'CLIENT',
              phone: input.phone,
              isActive: false,
              customerId: customer.id,
            },
            select: { id: true },
          });

          return customer;
        } catch (e: any) {
          // Prisma unique constraint
          if (e?.code === 'P2002') continue;
          throw e;
        }
      }
      throw new AppError('Failed to generate unique IDs. Please retry.', 500);
    });

    return result;
  },

  async refreshToken(token: string) {
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError('Refresh token expired or revoked', 401);
    }

    // Rotate token — clear all old tokens for this user
    await prisma.refreshToken.deleteMany({ where: { userId: decoded.userId } });

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive) throw new AppError('User not found', 401);

    const tokens = generateTokens(user.id, user.role, user.email);

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_EXPIRES_MS),
      },
    });

    return tokens;
  },

  async logout(token: string) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new AppError('Current password incorrect', 400);

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    // Revoke all refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId } });
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, userCode: true, name: true, email: true, role: true, phone: true,
        isActive: true, customerId: true, createdAt: true,
        customer: { select: { id: true, customerCode: true, name: true, phone: true, address: true } },
      },
    });
    if (!user) throw new AppError('User not found', 404);
    return user;
  },
};
