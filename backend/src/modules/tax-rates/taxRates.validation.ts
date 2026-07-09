import { z } from 'zod';

export const createTaxRateSchema = z.object({
  name: z.string().min(1),
  rate: z.number().positive().max(100),
  isActive: z.boolean().optional(),
});

export const updateTaxRateSchema = z.object({
  name: z.string().min(1).optional(),
  rate: z.number().positive().max(100).optional(),
  isActive: z.boolean().optional(),
});
