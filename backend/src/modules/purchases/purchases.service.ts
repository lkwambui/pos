import prisma from '../../config/database';
import { AppError, NotFoundError } from '../../utils/errors';
import { generateOrderNumber, generateGRN, calculateTotals } from '../../utils/helpers';

export const createPurchase = async (
  data: {
    supplierId: string;
    branchId?: string;
    notes?: string;
    items: { productId: string; quantity: number; unitCost: number }[];
  },
  userId: string,
) => {
  const orderNumber = generateOrderNumber();
  const totals = calculateTotals(data.items.map(i => ({
    quantity: i.quantity,
    unitPrice: i.unitCost,
    discount: 0,
    vatRate: 16,
  })));

  const purchase = await prisma.purchase.create({
    data: {
      orderNumber,
      supplierId: data.supplierId,
      branchId: data.branchId,
      userId,
      notes: data.notes,
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxAmount: totals.taxAmount,
      total: totals.total,
      items: {
        create: data.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: item.quantity * item.unitCost,
        })),
      },
    },
    include: { items: { include: { product: true } }, supplier: true, user: true },
  });

  return purchase;
};

export const receivePurchase = async (purchaseId: string, userId: string) => {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: { items: true },
  });

  if (!purchase) throw new NotFoundError('Purchase');
  if (purchase.status !== 'PENDING') throw new AppError('Purchase is not in PENDING status', 400);

  const grnNumber = generateGRN();

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.purchase.update({
      where: { id: purchaseId },
      data: { status: 'RECEIVED', grnNumber },
    });

    for (const item of purchase.items) {
      const stock = await tx.stock.upsert({
        where: { productId: item.productId },
        update: { quantity: { increment: item.quantity } },
        create: {
          productId: item.productId,
          quantity: item.quantity,
        },
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'PURCHASE',
          quantity: item.quantity,
          balanceBefore: stock.quantity - item.quantity,
          balanceAfter: stock.quantity,
          reference: purchase.orderNumber,
          userId,
        },
      });
    }

    return updated;
  });

  return result;
};
