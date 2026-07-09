import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, sendPaginated, sendCreated } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import { paginate, buildDateFilter, calculateTotals } from '../../utils/helpers';
import * as quotationService from './quotations.service';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const customerId = req.query.customerId as string;
    const status = req.query.status as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;

    const dateFilter = buildDateFilter(startDate, endDate);
    if (Object.keys(dateFilter).length) where.createdAt = dateFilter;

    const { skip, take } = paginate(page, limit);

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        skip,
        take,
        include: { customer: true, user: true, items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quotation.count({ where }),
    ]);

    sendPaginated(res, quotations, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id as string },
      include: { items: { include: { product: true } }, customer: true, user: true },
    });
    if (!quotation) throw new NotFoundError('Quotation');
    sendSuccess(res, quotation);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quotation = await quotationService.createQuotation(req.body, req.user!.userId);
    sendCreated(res, quotation);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.quotation.findUnique({ where: { id: req.params.id as string } });
    if (!existing) throw new NotFoundError('Quotation');

    const updateData: Record<string, unknown> = { ...req.body };
    if (updateData.items) {
      const totals = calculateTotals((updateData.items as { quantity: number; unitPrice: number; discount?: number; vatRate?: number }[]));
      updateData.subtotal = totals.subtotal;
      updateData.discount = totals.discount;
      updateData.taxAmount = totals.taxAmount;
      updateData.total = totals.total;

      await prisma.quotationItem.deleteMany({ where: { quotationId: req.params.id as string } });

      const items = updateData.items as { productId: string; quantity: number; unitPrice: number; discount?: number; vatRate?: number }[];
      for (const item of items) {
        await prisma.quotationItem.create({
          data: {
            quotationId: req.params.id as string,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            vatRate: item.vatRate || 16,
            totalPrice: (item.quantity * item.unitPrice - (item.discount || 0)) * (1 + ((item.vatRate || 16) / 100)),
          },
        });
      }
      delete updateData.items;
    }

    if (updateData.validUntil) {
      updateData.validUntil = new Date(updateData.validUntil as string);
    }

    const quotation = await prisma.quotation.update({
      where: { id: req.params.id as string },
      data: updateData,
      include: { items: { include: { product: true } }, customer: true, user: true },
    });

    sendSuccess(res, quotation, 'Quotation updated');
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.quotation.delete({ where: { id: req.params.id as string } });
    sendSuccess(res, null, 'Quotation deleted');
  } catch (error) {
    next(error);
  }
};

export const convertToSale = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sale = await quotationService.convertToSale(req.params.id as string, req.user!.userId);
    sendSuccess(res, sale, 'Quotation converted to sale');
  } catch (error) {
    next(error);
  }
};
