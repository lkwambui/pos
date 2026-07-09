import { z } from 'zod';

const variantSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  price: z.number().positive().optional(),
  cost: z.number().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
  lowStockLevel: z.number().int().nonnegative().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1),
  barcode: z.string().optional(),
  description: z.string().optional(),
  purchasePrice: z.number().nonnegative().optional(),
  sellingPrice: z.number().nonnegative().optional(),
  wholesalePrice: z.number().nonnegative().optional(),
  vatRate: z.number().nonnegative().optional(),
  unit: z.string().optional(),
  isService: z.boolean().optional(),
  trackStock: z.boolean().optional(),
  lowStockLevel: z.number().int().nonnegative().optional(),
  image: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  initialStock: z.number().int().nonnegative().optional(),
  variants: z.array(variantSchema).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  purchasePrice: z.number().nonnegative().optional(),
  sellingPrice: z.number().nonnegative().optional(),
  wholesalePrice: z.number().nonnegative().optional(),
  vatRate: z.number().nonnegative().optional(),
  unit: z.string().optional(),
  isService: z.boolean().optional(),
  trackStock: z.boolean().optional(),
  lowStockLevel: z.number().int().nonnegative().optional(),
  image: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  initialStock: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});
