import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { prisma } from '../config/prisma.js';

export function logAudit(action: string, entityType?: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    // Continue request processing first
    next();

    // Asynchronously log action if user is authenticated
    if (req.user?.userId) {
      try {
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        await prisma.auditLog.create({
          data: {
            userId: req.user.userId,
            action,
            entityType,
            entityId: req.params.id || null,
            detailsJson: JSON.stringify({
              method: req.method,
              path: req.originalUrl,
            }),
            ipAddress,
            userAgent,
          },
        });
      } catch (err) {
        // Silently catch audit log error to avoid interrupting response
        console.error('Audit logging error:', err);
      }
    }
  };
}
