import { z } from 'zod';

export const createExpenseSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().min(1),
  reference: z.string().optional(),
  date: z.string().datetime(),
  branchId: z.string().uuid().optional(),
  receipt: z.string().optional(),
});

export const updateExpenseSchema = z.object({
  categoryId: z.string().uuid().optional(),
  amount: z.number().positive().optional(),
  description: z.string().min(1).optional(),
  reference: z.string().optional(),
  date: z.string().datetime().optional(),
  branchId: z.string().uuid().optional(),
  receipt: z.string().optional(),
});

export const expenseQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  categoryId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});
