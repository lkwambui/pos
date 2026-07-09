import prisma from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { generateQuoteNumber, generateSaleNumber, calculateTotals } from '../../utils/helpers';

export const createQuotation = async (
  data: {
    customerId?: string;
    validUntil?: string;
    notes?: string;
    items: { productId: string; quantity: number; unitPrice: number; discount?: number; vatRate?: number }[];
  },
  userId: string,
) => {
  const quoteNumber = generateQuoteNumber();
  const totals = calculateTotals(data.items);

  const quotation = await prisma.quotation.create({
    data: {
      quoteNumber,
      customerId: data.customerId,
      userId,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      notes: data.notes,
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxAmount: totals.taxAmount,
      total: totals.total,
      items: {
        create: data.items.map(item => {
          const lineTotal = item.quantity * item.unitPrice;
          const lineDiscount = item.discount || 0;
          const lineAfterDiscount = lineTotal - lineDiscount;
          const vatRate = item.vatRate || 16;
          const vatAmount = lineAfterDiscount * (vatRate / 100);
          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: lineDiscount,
            vatRate,
            totalPrice: lineAfterDiscount + vatAmount,
          };
        }),
      },
    },
    include: { items: { include: { product: true } }, customer: true },
  });

  return quotation;
};

export const convertToSale = async (quotationId: string, userId: string) => {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { items: { include: { product: true } } },
  });

  if (!quotation) throw new NotFoundError('Quotation');
  if (quotation.status !== 'ACCEPTED') throw new NotFoundError('Quotation must be ACCEPTED before converting to sale');

  const saleNumber = generateSaleNumber();

  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        saleNumber,
        customerId: quotation.customerId,
        userId,
        subtotal: quotation.subtotal,
        discount: quotation.discount,
        taxAmount: quotation.taxAmount,
        total: quotation.total,
        quotationId: quotation.id,
        items: {
          create: quotation.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            vatRate: item.vatRate,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: { items: { include: { product: true } }, customer: true },
    });

    await tx.quotation.update({
      where: { id: quotationId },
      data: { status: 'ACCEPTED' },
    });

    return created;
  });

  return sale;
};
