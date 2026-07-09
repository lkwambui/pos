import { z } from 'zod';

const saleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().min(0).optional().default(0),
  vatRate: z.number().min(0).optional().default(16),
});

export const createSaleSchema = z.object({
  customerId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  amountPaid: z.number().min(0).optional().default(0),
  notes: z.string().optional(),
});

export const updateSaleStatusSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'SUSPENDED', 'HOLD', 'REFUNDED']),
});
