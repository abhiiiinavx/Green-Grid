import { z } from 'zod';

export const createGoalSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Goal title is required'),
    goalType: z.enum(['MONTHLY_KWH', 'MONTHLY_COST', 'CARBON_REDUCTION', 'SOLAR_SELF_CONSUMPTION']),
    targetValue: z.number().positive('Target value must be positive'),
    unit: z.string().min(1),
    endDate: z.string(),
  }),
});

export const updateGoalSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    targetValue: z.number().positive().optional(),
    currentValue: z.number().optional(),
    status: z.enum(['ON_TRACK', 'AT_RISK', 'BEHIND', 'ACHIEVED']).optional(),
    endDate: z.string().optional(),
  }),
});

export const updateBudgetSchema = z.object({
  body: z.object({
    budgetAmount: z.number().positive('Budget amount must be positive'),
    alertThresholdPercent: z.number().min(1).max(100).optional(),
  }),
});
