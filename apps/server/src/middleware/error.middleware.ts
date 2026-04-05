import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public errors?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  // Prisma errors
  if ((err as any).code === 'P2002') {
    const field = (err as any).meta?.target?.[0] || 'field';
    return res.status(409).json({ success: false, message: `${field} already exists` });
  }

  if ((err as any).code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }

  logger.error('Unhandled error:', err);
  return res.status(500).json({ success: false, message: 'Internal server error' });
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);
