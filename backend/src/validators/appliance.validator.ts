import { z } from 'zod';

export const createApplianceSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Appliance name is required'),
    category: z.enum([
      'COOLING',
      'HEATING',
      'LIGHTING',
      'KITCHEN',
      'ELECTRONICS',
      'APPLIANCES',
      'HEAVY_MACHINERY',
      'OTHER',
    ]),
    powerRatingWatts: z.number().positive('Power rating must be positive'),
    isSmart: z.boolean().optional(),
    isOn: z.boolean().optional(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
    room: z.string().min(1).optional(),
    dailyAvgHours: z.number().min(0).max(24).optional(),
    scheduleOn: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm').optional().nullable(),
    scheduleOff: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm').optional().nullable(),
  }),
});

export const updateApplianceSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    category: z.enum([
      'COOLING',
      'HEATING',
      'LIGHTING',
      'KITCHEN',
      'ELECTRONICS',
      'APPLIANCES',
      'HEAVY_MACHINERY',
      'OTHER',
    ]).optional(),
    powerRatingWatts: z.number().positive().optional(),
    isSmart: z.boolean().optional(),
    isOn: z.boolean().optional(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
    room: z.string().min(1).optional(),
    dailyAvgHours: z.number().min(0).max(24).optional(),
    scheduleOn: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm').optional().nullable(),
    scheduleOff: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm').optional().nullable(),
  }),
});

export const toggleApplianceSchema = z.object({
  body: z.object({
    isOn: z.boolean(),
  }),
});
