import prisma from '../../config/database';
import { InvoiceStatus } from '@prisma/client';
import { NotFoundError } from '../../utils/errors';
import { generateInvoiceNumber } from '../../utils/helpers';

export const generateInvoice = async (saleId: string) => {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: true, customer: true },
  });

  if (!sale) throw new NotFoundError('Sale');
  if (!sale.customerId) throw new Error('Cannot generate invoice for sale without customer');

  const existing = await prisma.invoice.findUnique({ where: { saleId } });
  if (existing) return existing;

  const invoiceNumber = generateInvoiceNumber();

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      saleId: sale.id,
      customerId: sale.customerId,
      subtotal: sale.subtotal,
      discount: sale.discount,
      taxAmount: sale.taxAmount,
      total: sale.total,
      amountPaid: sale.amountPaid,
      status: sale.paymentStatus === 'PAID' ? 'PAID' : 'UNPAID',
      items: {
        create: sale.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          vatRate: item.vatRate,
          vatAmount: item.vatAmount,
          totalPrice: item.totalPrice,
        })),
      },
    },
    include: { items: { include: { product: true } }, customer: true, sale: true },
  });

  return invoice;
};

export const updateInvoiceStatus = async (invoiceId: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });

  if (!invoice) throw new NotFoundError('Invoice');

  const totalPaid = invoice.payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

  const total = parseFloat(invoice.total.toString());

  let status: InvoiceStatus = invoice.status;
  if (invoice.status === InvoiceStatus.CANCELLED) {
    status = InvoiceStatus.CANCELLED;
  } else if (totalPaid <= 0) {
    status = InvoiceStatus.UNPAID;
  } else if (totalPaid >= total) {
    status = InvoiceStatus.PAID;
  } else {
    status = InvoiceStatus.PARTIALLY_PAID;
  }

  if (invoice.dueDate && new Date() > invoice.dueDate && status === InvoiceStatus.UNPAID) {
    status = InvoiceStatus.OVERDUE;
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status,
      amountPaid: totalPaid,
    },
    include: { items: { include: { product: true } }, payments: true, customer: true },
  });
};
