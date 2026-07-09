import { z } from 'zod';

export const updateSettingSchema = z.object({
  value: z.unknown(),
  group: z.string().optional(),
});

export const updateBulkSettingsSchema = z.array(
  z.object({
    key: z.string().min(1),
    value: z.unknown(),
    group: z.string().optional(),
  }),
);
