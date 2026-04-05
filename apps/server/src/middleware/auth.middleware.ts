import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';
import { prisma } from '../prisma/client';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    email: string;
    customerId?: string | null;
  };
}

export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, email: true, customerId: true, isActive: true },
    });

    if (!user || !user.isActive) throw new AppError('User not found or inactive', 401);

    req.user = {
      userId: user.id,
      role: user.role,
      email: user.email,
      customerId: user.customerId,
    };
    next();
  } catch (err: any) {
    if (err instanceof AppError) return next(err);
    if (err.name === 'JsonWebTokenError') return next(new AppError('Invalid token', 401));
    if (err.name === 'TokenExpiredError') return next(new AppError('Token expired', 401));
    next(err);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Unauthenticated', 401));
    if (!roles.includes(req.user.role)) return next(new AppError('Forbidden', 403));
    next();
  };
};
