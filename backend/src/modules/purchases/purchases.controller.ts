import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, sendPaginated, sendCreated } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import { paginate, buildDateFilter } from '../../utils/helpers';
import * as purchaseService from './purchases.service';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const supplierId = req.query.supplierId as string;
    const status = req.query.status as string;
    const branchId = req.query.branchId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: Record<string, unknown> = {};
    if (search) {
      where.orderNumber = { contains: search, mode: 'insensitive' };
    }
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;
    if (branchId) where.branchId = branchId;

    const dateFilter = buildDateFilter(startDate, endDate);
    if (Object.keys(dateFilter).length) where.createdAt = dateFilter;

    const { skip, take } = paginate(page, limit);

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        skip,
        take,
        include: { supplier: true, user: true, items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.purchase.count({ where }),
    ]);

    sendPaginated(res, purchases, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: req.params.id as string },
      include: { items: { include: { product: true } }, supplier: true, user: true },
    });
    if (!purchase) throw new NotFoundError('Purchase');
    sendSuccess(res, purchase);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const purchase = await purchaseService.createPurchase(req.body, req.user!.userId);
    sendCreated(res, purchase);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const purchase = await prisma.purchase.update({
      where: { id: req.params.id as string },
      data: req.body,
      include: { items: { include: { product: true } }, supplier: true, user: true },
    });
    sendSuccess(res, purchase, 'Purchase updated');
  } catch (error) {
    next(error);
  }
};

export const receive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await purchaseService.receivePurchase(req.params.id as string, req.user!.userId);
    sendSuccess(res, result, 'Purchase received');
  } catch (error) {
    next(error);
  }
};

export const cancel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const purchase = await prisma.purchase.update({
      where: { id: req.params.id as string },
      data: { status: 'CANCELLED' },
      include: { items: { include: { product: true } }, supplier: true, user: true },
    });
    sendSuccess(res, purchase, 'Purchase cancelled');
  } catch (error) {
    next(error);
  }
};
