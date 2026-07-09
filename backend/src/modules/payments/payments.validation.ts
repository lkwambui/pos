import { z } from 'zod';

export const createPaymentSchema = z.object({
  saleId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  amount: z.number().positive(),
  method: z.enum(['CASH', 'CARD', 'MPESA', 'BANK_TRANSFER', 'SPLIT', 'CREDIT']),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const refundPaymentSchema = z.object({
  notes: z.string().optional(),
});
