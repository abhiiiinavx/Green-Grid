import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
import { prisma } from '../config/prisma.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    sendError(res, 'Authentication token required', 401, 'UNAUTHORIZED');
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    
    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      sendError(res, 'User account is inactive or deleted', 403, 'FORBIDDEN');
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      sendError(res, 'Token has expired', 401, 'TOKEN_EXPIRED');
      return;
    }
    sendError(res, 'Invalid authentication token', 401, 'INVALID_TOKEN');
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(res, 'Insufficient permissions for this resource', 403, 'FORBIDDEN');
      return;
    }

    next();
  };
}
