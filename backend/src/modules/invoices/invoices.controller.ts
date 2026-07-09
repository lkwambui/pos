import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import { paginate, buildDateFilter } from '../../utils/helpers';
import { logger } from '../../utils/logger';
import * as invoicesService from './invoices.service';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { skip, take } = paginate(page, limit);

    const search = req.query.search as string;
    const status = req.query.status as string;
    const customerId = req.query.customerId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: Record<string, unknown> = {};
    if (search) where.invoiceNumber = { contains: search, mode: 'insensitive' };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    Object.assign(where, buildDateFilter(startDate, endDate));

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take,
        include: {
          customer: true,
          sale: { select: { id: true, saleNumber: true } },
          _count: { select: { items: true, payments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    sendPaginated(res, invoices, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id as string },
      include: {
        items: { include: { product: true } },
        payments: true,
        sale: true,
        customer: true,
      },
    });
    if (!invoice) throw new NotFoundError('Invoice');
    sendSuccess(res, invoice);
  } catch (error) {
    next(error);
  }
};

export const getByNumber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber: req.params.invoiceNumber as string },
      include: {
        items: { include: { product: true } },
        payments: true,
        sale: true,
        customer: true,
      },
    });
    if (!invoice) throw new NotFoundError('Invoice');
    sendSuccess(res, invoice);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id as string } });
    if (!invoice) throw new NotFoundError('Invoice');

    const data: Record<string, unknown> = {};
    if (req.body.status) data.status = req.body.status;
    if (req.body.dueDate) data.dueDate = new Date(req.body.dueDate);
    if (req.body.notes !== undefined) data.notes = req.body.notes;

    const updated = await prisma.invoice.update({
      where: { id: req.params.id as string },
      data,
      include: { items: { include: { product: true } }, customer: true },
    });

    sendSuccess(res, updated, 'Invoice updated');
  } catch (error) {
    next(error);
  }
};

export const sendByEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id as string },
      include: { customer: true },
    }) as any;
    if (!invoice) throw new NotFoundError('Invoice');

    logger.info({ invoiceId: invoice.id, customerEmail: invoice.customer?.email }, 'Invoice email would be sent here');
    sendSuccess(res, null, 'Invoice email sent successfully');
  } catch (error) {
    next(error);
  }
};
