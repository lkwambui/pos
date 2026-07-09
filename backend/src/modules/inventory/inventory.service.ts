import prisma from '../../config/database';
import { NotFoundError } from '../../utils/errors';

export const adjustStock = async (
  productId: string,
  type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT',
  quantity: number,
  reason?: string,
  reference?: string,
  userId?: string,
  branchId?: string,
) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError('Product');

  const adjustment = await prisma.stockAdjustment.create({
    data: {
      productId,
      type,
      quantity,
      reason,
      reference,
      userId: userId || '',
      branchId,
    },
  });

  const currentStock = await prisma.stock.findUnique({ where: { productId } });
  const balanceBefore = currentStock?.quantity || 0;

  let balanceAfter: number;
  if (type === 'STOCK_IN' || type === 'TRANSFER_IN') {
    balanceAfter = balanceBefore + quantity;
  } else if (type === 'STOCK_OUT' || type === 'TRANSFER_OUT') {
    balanceAfter = Math.max(0, balanceBefore - quantity);
  } else {
    balanceAfter = Math.max(0, balanceBefore + quantity);
  }

  const stock = await prisma.stock.upsert({
    where: { productId },
    create: {
      productId,
      quantity: balanceAfter,
    },
    update: {
      quantity: balanceAfter,
    },
  });

  const movement = await prisma.stockMovement.create({
    data: {
      productId,
      type: 'ADJUSTMENT',
      quantity,
      balanceBefore,
      balanceAfter,
      reference,
      userId: userId || '',
    },
  });

  return { adjustment, stock, movement };
};

export const getStockWithMovements = async (productId: string) => {
  const stock = await prisma.stock.findUnique({
    where: { productId },
    include: {
      product: { include: { category: true, brand: true } },
    },
  });

  if (!stock) throw new NotFoundError('Stock');

  const movements = await prisma.stockMovement.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return { stock, movements };
};

export const checkLowStock = async (branchId?: string) => {
  const productWhere: Record<string, unknown> = { isActive: true };
  if (branchId) {
    productWhere.branchId = branchId;
  }

  const products = await prisma.product.findMany({
    where: productWhere,
    select: {
      id: true,
      name: true,
      sku: true,
      lowStockLevel: true,
      stock: { select: { quantity: true } },
      category: true,
      brand: true,
    },
  });

  return products.filter(p => {
    const qty = p.stock?.quantity || 0;
    return qty > 0 && qty <= p.lowStockLevel;
  });
};
