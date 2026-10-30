import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    location: z.string().optional(),
    userType: z.enum(['HOME', 'HOSTEL', 'OFFICE', 'SMALL_BUSINESS', 'CAMPUS']).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    userType: z.enum(['HOME', 'HOSTEL', 'OFFICE', 'SMALL_BUSINESS', 'CAMPUS']).optional(),
    monthlyBudget: z.number().min(0).optional(),
    energyGoalKwh: z.number().min(0).optional(),
    carbonGoalReduction: z.number().min(0).max(100).optional(),
    hasSolar: z.boolean().optional(),
    hasBattery: z.boolean().optional(),
    isOnboarded: z.boolean().optional(),
  }),
});

export const onboardingSchema = z.object({
  body: z.object({
    userType: z.enum(['HOME', 'HOSTEL', 'OFFICE', 'SMALL_BUSINESS', 'CAMPUS']),
    approxMonthlyUsageKwh: z.number().positive(),
    tariffRate: z.number().positive().optional(),
    applianceCount: z.number().int().min(1).optional(),
    hasSolar: z.boolean(),
    hasBattery: z.boolean(),
    location: z.string().optional(),
  }),
});
