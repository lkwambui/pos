import { z } from 'zod';

export const createRegisterSchema = z.object({
  name: z.string().min(1),
  branchId: z.string().uuid(),
  isActive: z.boolean().optional(),
});

export const updateRegisterSchema = z.object({
  name: z.string().min(1).optional(),
  branchId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});
