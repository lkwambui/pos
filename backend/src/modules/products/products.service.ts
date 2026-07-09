import prisma from '../../config/database';

export const generateProductSku = (name: string): string => {
  const prefix = name.substring(0, 3).toUpperCase();
  return `${prefix}-${Date.now()}`;
};

export const updateStockOnCreate = async (productId: string, initialStock: number) => {
  const stock = await prisma.stock.upsert({
    where: { productId },
    create: {
      productId,
      quantity: initialStock,
    },
    update: {
      quantity: initialStock,
    },
  });

  await prisma.stockMovement.create({
    data: {
      productId,
      type: 'INITIAL',
      quantity: initialStock,
      balanceBefore: 0,
      balanceAfter: initialStock,
    },
  });

  return stock;
};
