import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, sendPaginated, sendCreated } from '../../utils/response';
import { NotFoundError, AppError } from '../../utils/errors';
import { paginate, buildDateFilter } from '../../utils/helpers';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { skip, take } = paginate(page, limit);

    const saleId = req.query.saleId as string;
    const invoiceId = req.query.invoiceId as string;
    const method = req.query.method as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: Record<string, unknown> = {};
    if (saleId) where.saleId = saleId;
    if (invoiceId) where.invoiceId = invoiceId;
    if (method) where.method = method;
    Object.assign(where, buildDateFilter(startDate, endDate));

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take,
        include: {
          sale: { select: { id: true, saleNumber: true } },
          invoice: { select: { id: true, invoiceNumber: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    sendPaginated(res, payments, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id as string },
      include: {
        sale: { select: { id: true, saleNumber: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!payment) throw new NotFoundError('Payment');
    sendSuccess(res, payment);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { saleId, invoiceId, amount, method, reference, notes } = req.body;

    if (!saleId && !invoiceId) {
      throw new AppError('Either saleId or invoiceId is required', 400);
    }

    const payment = await prisma.$transaction(async (tx) => {
      const pay = await tx.payment.create({
        data: {
          saleId,
          invoiceId,
          amount,
          method,
          reference,
          notes,
          userId: req.user!.userId,
        },
      });

      if (saleId) {
        const sale = await tx.sale.findUnique({ where: { id: saleId } });
        if (!sale) throw new NotFoundError('Sale');

        const totalPaid = parseFloat(sale.amountPaid.toString()) + amount;
        const totalVal = parseFloat(sale.total.toString());

        await tx.sale.update({
          where: { id: saleId },
          data: {
            amountPaid: totalPaid,
            changeAmount: totalPaid > totalVal ? totalPaid - totalVal : 0,
            paymentStatus: totalPaid >= totalVal ? 'PAID' : 'PARTIALLY_PAID',
          },
        });
      }

      if (invoiceId) {
        const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
        if (!invoice) throw new NotFoundError('Invoice');

        const totalPaid = parseFloat(invoice.amountPaid.toString()) + amount;
        const totalVal = parseFloat(invoice.total.toString());

        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            amountPaid: totalPaid,
            status: totalPaid >= totalVal ? 'PAID' : 'PARTIALLY_PAID',
          },
        });
      }

      return pay;
    });

    sendCreated(res, payment, 'Payment recorded successfully');
  } catch (error) {
    next(error);
  }
};

export const refund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id as string } });
    if (!payment) throw new NotFoundError('Payment');
    if (payment.status === 'REFUNDED') throw new AppError('Payment already refunded', 400);

    const refunded = await prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: req.params.id as string },
        data: { status: 'REFUNDED', notes: req.body.notes || payment.notes },
      });

      if (payment.saleId) {
        const sale = await tx.sale.findUnique({ where: { id: payment.saleId } });
        if (sale) {
          const totalPaid = parseFloat(sale.amountPaid.toString()) - parseFloat(payment.amount.toString());
          await tx.sale.update({
            where: { id: payment.saleId },
            data: {
              amountPaid: Math.max(0, totalPaid),
              paymentStatus: totalPaid <= 0 ? 'REFUNDED' : 'PARTIALLY_PAID',
            },
          });
        }
      }

      if (payment.invoiceId) {
        const invoice = await tx.invoice.findUnique({ where: { id: payment.invoiceId } });
        if (invoice) {
          const totalPaid = parseFloat(invoice.amountPaid.toString()) - parseFloat(payment.amount.toString());
          await tx.invoice.update({
            where: { id: payment.invoiceId },
            data: {
              amountPaid: Math.max(0, totalPaid),
              status: totalPaid <= 0 ? 'UNPAID' : 'PARTIALLY_PAID',
            },
          });
        }
      }

      return updated;
    });

    sendSuccess(res, refunded, 'Payment refunded');
  } catch (error) {
    next(error);
  }
};
