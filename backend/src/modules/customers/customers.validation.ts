import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  kraPin: z.string().optional(),
  address: z.string().optional(),
  branchId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  kraPin: z.string().optional(),
  address: z.string().optional(),
  branchId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});
