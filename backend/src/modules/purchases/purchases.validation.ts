import { z } from 'zod';

export const createPurchaseSchema = z.object({
  supplierId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    unitCost: z.number().positive(),
  })).min(1),
});

export const updatePurchaseSchema = z.object({
  status: z.enum(['PENDING', 'RECEIVED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
});

export const purchaseQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  supplierId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'RECEIVED', 'CANCELLED']).optional(),
  branchId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
