import { z } from 'zod';

export const discountTypeEnum = z.enum(['PERCENTAGE', 'FIXED']);

export const createDiscountSchema = z.object({
  name: z.string().min(1),
  type: discountTypeEnum,
  value: z.number().positive(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  minPurchase: z.number().positive().optional(),
});

export const updateDiscountSchema = z.object({
  name: z.string().min(1).optional(),
  type: discountTypeEnum.optional(),
  value: z.number().positive().optional(),
  validFrom: z.string().datetime().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
  minPurchase: z.number().positive().optional().nullable(),
});
