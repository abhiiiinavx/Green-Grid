import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, location, userType } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      sendError(res, 'Email already registered', 409, 'EMAIL_EXISTS');
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'USER',
        profile: {
          create: {
            location: location || 'Bengaluru, India',
            userType: userType || 'HOME',
            isOnboarded: false,
          },
        },
        tariffs: {
          create: {
            name: 'Standard Residential Slab Tariff',
            type: 'SLAB',
            baseRatePerKwh: 6.5,
            fixedMonthlyCharge: 120,
            taxPercent: 9,
            slab1Limit: 100,
            slab1Rate: 4.75,
            slab2Limit: 300,
            slab2Rate: 6.50,
            slab3Rate: 8.25,
            peakRate: 8.50,
            offPeakRate: 4.20,
            isActive: true,
          },
        },
        solarSystem: {
          create: {
            capacityKw: 4.5,
            panelCount: 12,
            isActive: true,
          },
        },
        battery: {
          create: {
            capacityKwh: 10.0,
            currentChargePercent: 80.0,
            state: 'CHARGING',
          },
        },
      },
      include: {
        profile: true,
      },
    });

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    sendSuccess(
      res,
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          profile: user.profile,
        },
        accessToken,
        refreshToken,
      },
      'User registered successfully',
      201
    );
  } catch (error: any) {
    console.error('Register error:', error);
    sendError(res, error.message || 'Failed to register', 500);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user || !user.isActive) {
      sendError(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      sendError(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
      return;
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Persist refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    sendSuccess(
      res,
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          profile: user.profile,
        },
        accessToken,
        refreshToken,
      },
      'Logged in successfully'
    );
  } catch (error: any) {
    console.error('Login error:', error);
    sendError(res, error.message || 'Login failed', 500);
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      sendError(res, 'Refresh token required', 400, 'MISSING_TOKEN');
      return;
    }

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.revokedAt || new Date() > tokenRecord.expiresAt) {
      sendError(res, 'Refresh token invalid or expired', 401, 'INVALID_REFRESH_TOKEN');
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    sendSuccess(res, { accessToken: newAccessToken }, 'Token refreshed');
  } catch (error: any) {
    sendError(res, 'Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }
}

export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revokedAt: new Date() },
      });
    }
    sendSuccess(res, null, 'Logged out successfully');
  } catch (error: any) {
    sendError(res, 'Logout failed', 500);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        profile: true,
        tariffs: { where: { isActive: true } },
        solarSystem: true,
        battery: true,
      },
    });

    if (!user) {
      sendError(res, 'User not found', 404, 'NOT_FOUND');
      return;
    }

    sendSuccess(res, user);
  } catch (error: any) {
    sendError(res, 'Failed to fetch user', 500);
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  // Simulated password reset workflow for security
  sendSuccess(res, { email }, 'If that email is registered, password reset instructions have been sent.');
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  if (email && password) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.updateMany({
      where: { email },
      data: { passwordHash },
    });
  }
  sendSuccess(res, null, 'Password reset successfully. You can now login.');
}
