import { z } from 'zod';

export const submitInvoiceSchema = z.object({
  saleId: z.string().uuid(),
});

export const updateEtimsSettingsSchema = z.object({
  deviceSerial: z.string().optional(),
  branchCode: z.string().optional(),
  kraPin: z.string().optional(),
  apiBaseUrl: z.string().url().optional(),
  autoSync: z.boolean().optional(),
  offlineQueue: z.boolean().optional(),
  retryFailed: z.boolean().optional(),
  emailAlerts: z.boolean().optional(),
});
