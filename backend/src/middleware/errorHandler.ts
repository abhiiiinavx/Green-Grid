import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(`[Unhandled Error] ${req.method} ${req.url}:`, err);

  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 'Validation error', 400, 'VALIDATION_ERROR', details);
    return;
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      sendError(res, 'A resource with this unique identifier already exists', 409, 'DUPLICATE_RESOURCE');
      return;
    }
    if (err.code === 'P2025') {
      sendError(res, 'Resource not found', 404, 'NOT_FOUND');
      return;
    }
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errorCode = err.errorCode || 'INTERNAL_ERROR';

  sendError(res, message, statusCode, errorCode);
}
