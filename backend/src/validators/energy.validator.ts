import { z } from 'zod';

export const readingQuerySchema = z.object({
  query: z.object({
    timeframe: z.enum(['today', '7d', '30d', '6m', 'custom']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    applianceId: z.string().optional(),
    metric: z.enum(['kwh', 'cost']).optional(),
  }),
});

export const liveReadingSchema = z.object({
  body: z.object({
    activePowerKw: z.number().positive(),
    voltage: z.number().positive().optional(),
    current: z.number().positive().optional(),
    frequency: z.number().positive().optional(),
    powerFactor: z.number().min(0).max(1).optional(),
    applianceId: z.string().optional(),
  }),
});
