import { z } from 'zod';

export const stkPushSchema = z.object({
  paymentId: z.string().uuid(),
  phone: z.string().min(10).max(13),
});

export const stkPushDirectSchema = z.object({
  phone: z.string().min(10).max(13),
  amount: z.number().positive(),
  accountRef: z.string().max(12).optional(),
});

export const queryStatusSchema = z.object({
  checkoutRequestId: z.string(),
});
