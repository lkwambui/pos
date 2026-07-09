import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, sendPaginated, sendCreated } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import { paginate, buildDateFilter } from '../../utils/helpers';
import * as salesService from './sales.service';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { skip, take } = paginate(page, limit);

    const search = req.query.search as string;
    const status = req.query.status as string;
    const paymentStatus = req.query.paymentStatus as string;
    const customerId = req.query.customerId as string;
    const branchId = req.query.branchId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: Record<string, unknown> = {};
    if (search) where.saleNumber = { contains: search, mode: 'insensitive' };
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (customerId) where.customerId = customerId;
    if (branchId) where.branchId = branchId;
    Object.assign(where, buildDateFilter(startDate, endDate));

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take,
        include: {
          customer: true,
          user: { select: { id: true, firstName: true, lastName: true } },
          branch: true,
          _count: { select: { items: true, payments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sale.count({ where }),
    ]);

    sendPaginated(res, sales, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id as string },
      include: {
        items: { include: { product: true } },
        payments: true,
        customer: true,
        invoice: true,
      },
    });
    if (!sale) throw new NotFoundError('Sale');
    sendSuccess(res, sale);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sale = await salesService.createSale(req.body, req.user!.userId);
    sendCreated(res, sale, 'Sale created successfully');
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sale = await prisma.sale.update({
      where: { id: req.params.id as string },
      data: { status: req.body.status },
      include: { items: { include: { product: true } }, customer: true },
    });
    sendSuccess(res, sale, 'Sale updated');
  } catch (error) {
    next(error);
  }
};

export const cancel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sale = await salesService.cancelSale(req.params.id as string);
    sendSuccess(res, sale, 'Sale cancelled successfully');
  } catch (error) {
    next(error);
  }
};

export const getByNumber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { saleNumber: req.params.saleNumber as string },
      include: {
        items: { include: { product: true } },
        payments: true,
        customer: true,
        invoice: true,
      },
    });
    if (!sale) throw new NotFoundError('Sale');
    sendSuccess(res, sale);
  } catch (error) {
    next(error);
  }
};
