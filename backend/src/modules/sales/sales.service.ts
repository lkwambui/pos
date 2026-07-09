import prisma from '../../config/database';
import { AppError, NotFoundError, ConflictError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { generateSaleNumber, generateInvoiceNumber, calculateTotals } from '../../utils/helpers';
import type { MovementType } from '@prisma/client';

export const createSale = async (data: {
  customerId?: string;
  branchId?: string;
  items: { productId: string; quantity: number; unitPrice: number; discount?: number; vatRate?: number }[];
  amountPaid?: number;
  notes?: string;
}, userId: string) => {
  const saleNumber = generateSaleNumber();
  const totals = calculateTotals(data.items);

  const sale = await prisma.$transaction(async (tx) => {
    for (const item of data.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new NotFoundError(`Product ${item.productId}`);

      if (product.trackStock) {
        const stock = await tx.stock.findUnique({ where: { productId: item.productId } });
        if (!stock || stock.quantity < item.quantity) {
          throw new AppError(`Insufficient stock for product: ${product.name}`, 400);
        }
      }
    }

    const sale = await tx.sale.create({
      data: {
        saleNumber,
        customerId: data.customerId,
        branchId: data.branchId,
        userId,
        subtotal: totals.subtotal,
        discount: totals.discount,
        taxAmount: totals.taxAmount,
        total: totals.total,
        amountPaid: data.amountPaid || 0,
        changeAmount: data.amountPaid && data.amountPaid > totals.total ? data.amountPaid - totals.total : 0,
        paymentStatus: !data.amountPaid || data.amountPaid === 0 ? 'PENDING' : data.amountPaid >= totals.total ? 'PAID' : 'PARTIALLY_PAID',
        notes: data.notes,
        items: {
          create: data.items.map((item) => {
            const vatRate = item.vatRate || 16;
            const lineTotal = item.quantity * item.unitPrice;
            const lineDiscount = item.discount || 0;
            const lineAfterDiscount = lineTotal - lineDiscount;
            const vatAmount = lineAfterDiscount * (vatRate / 100);
            return {
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: lineDiscount,
              vatRate,
              vatAmount: Math.round(vatAmount * 100) / 100,
              totalPrice: Math.round(lineTotal * 100) / 100,
            };
          }),
        },
      },
      include: { items: { include: { product: true } }, customer: true },
    });

    for (const item of data.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (product?.trackStock) {
        const stock = await tx.stock.findUnique({ where: { productId: item.productId } });
        const beforeQty = stock?.quantity || 0;
        const afterQty = beforeQty - item.quantity;

        await tx.stock.update({
          where: { productId: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'SALE' as MovementType,
            quantity: -item.quantity,
            balanceBefore: beforeQty,
            balanceAfter: afterQty,
            reference: sale.id,
            userId,
          },
        });
      }
    }

    if (data.amountPaid && data.amountPaid > 0) {
      await tx.payment.create({
        data: {
          saleId: sale.id,
          amount: data.amountPaid,
          method: 'CASH',
          status: 'PAID',
          userId,
        },
      });
    }

    if (sale.paymentStatus === 'PAID' && sale.customerId) {
      await tx.invoice.create({
        data: {
          invoiceNumber: generateInvoiceNumber(),
          saleId: sale.id,
          customerId: sale.customerId,
          subtotal: sale.subtotal,
          discount: sale.discount,
          taxAmount: sale.taxAmount,
          total: sale.total,
          amountPaid: sale.amountPaid,
          status: 'PAID',
        },
      });
    }

    if (sale.customerId) {
      await tx.customer.update({
        where: { id: sale.customerId },
        data: {
          totalPurchases: { increment: 1 },
          totalSpent: { increment: totals.total },
        },
      });
    }

    return sale;
  });

  return sale;
};

export const cancelSale = async (saleId: string) => {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: true, invoice: true },
  });

  if (!sale) throw new NotFoundError('Sale');
  if (sale.status === 'CANCELLED') throw new AppError('Sale is already cancelled', 400);

  const cancelled = await prisma.$transaction(async (tx) => {
    for (const item of sale.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (product?.trackStock) {
        const stock = await tx.stock.findUnique({ where: { productId: item.productId } });
        const beforeQty = stock?.quantity || 0;
        const afterQty = beforeQty + item.quantity;

        await tx.stock.update({
          where: { productId: item.productId },
          data: { quantity: { increment: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'RETURN' as MovementType,
            quantity: item.quantity,
            balanceBefore: beforeQty,
            balanceAfter: afterQty,
            reference: sale.id,
          },
        });
      }
    }

    if (sale.invoice) {
      await tx.invoice.update({
        where: { id: sale.invoice.id },
        data: { status: 'CANCELLED' },
      });
    }

    return tx.sale.update({
      where: { id: saleId },
      data: { status: 'CANCELLED', paymentStatus: 'REFUNDED' },
      include: { items: { include: { product: true } }, customer: true, invoice: true },
    });
  });

  return cancelled;
};

export const getDashboardStats = async (branchId?: string, startDate?: string, endDate?: string) => {
  const where: Record<string, unknown> = {
    status: { not: 'CANCELLED' },
  };
  if (branchId) where.branchId = branchId;

  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    where.createdAt = dateFilter;
  }

  const [salesCount, revenueAgg, averageOrder] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.aggregate({
      where,
      _sum: { total: true },
    }),
    prisma.sale.aggregate({
      where,
      _avg: { total: true },
    }),
  ]);

  return {
    salesCount,
    totalRevenue: revenueAgg._sum.total || 0,
    averageOrderValue: averageOrder._avg.total || 0,
  };
};
