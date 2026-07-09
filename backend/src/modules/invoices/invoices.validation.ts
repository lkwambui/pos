import { z } from 'zod';

export const updateInvoiceSchema = z.object({
  status: z.enum(['PAID', 'UNPAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED']).optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});
