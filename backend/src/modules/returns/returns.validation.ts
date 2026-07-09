import { z } from 'zod';

export const createReturnSchema = z.object({
  saleId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  reason: z.string().min(1),
  total: z.number().min(0).optional(),
});

export const returnQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
