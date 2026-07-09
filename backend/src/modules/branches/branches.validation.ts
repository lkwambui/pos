import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  kraPin: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateBranchSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  kraPin: z.string().optional(),
  isActive: z.boolean().optional(),
});
