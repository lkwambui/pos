import { z } from 'zod';

export const createQuotationSchema = z.object({
  customerId: z.string().uuid().optional(),
  validUntil: z.string().datetime().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    discount: z.number().min(0).optional(),
    vatRate: z.number().min(0).optional(),
  })).min(1),
});

export const updateQuotationSchema = z.object({
  customerId: z.string().uuid().optional(),
  validUntil: z.string().datetime().optional(),
  notes: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    discount: z.number().min(0).optional(),
    vatRate: z.number().min(0).optional(),
  })).optional(),
});

export const quotationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  customerId: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
