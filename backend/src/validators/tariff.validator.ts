import { z } from 'zod';

export const tariffSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Tariff name is required'),
    type: z.enum(['FLAT', 'SLAB', 'TIME_OF_USE']),
    baseRatePerKwh: z.number().min(0),
    fixedMonthlyCharge: z.number().min(0).optional(),
    taxPercent: z.number().min(0).max(100).optional(),
    slab1Limit: z.number().min(0).optional(),
    slab1Rate: z.number().min(0).optional(),
    slab2Limit: z.number().min(0).optional(),
    slab2Rate: z.number().min(0).optional(),
    slab3Rate: z.number().min(0).optional(),
    peakRate: z.number().min(0).optional(),
    offPeakRate: z.number().min(0).optional(),
    peakStartHour: z.number().min(0).max(23).optional(),
    peakEndHour: z.number().min(0).max(23).optional(),
    isActive: z.boolean().optional(),
  }),
});
