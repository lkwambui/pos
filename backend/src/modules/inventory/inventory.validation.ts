import { z } from 'zod';

export const adjustStockSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT']),
  quantity: z.number().int().positive(),
  reason: z.string().optional(),
  reference: z.string().optional(),
  branchId: z.string().uuid().optional(),
});
