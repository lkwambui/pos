import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, sendPaginated, sendCreated } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import { paginate, buildDateFilter } from '../../utils/helpers';
import * as inventoryService from './inventory.service';

export const getStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { skip, take, page: currentPage, limit: lmt } = paginate(
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 20,
    );
    const search = req.query.search as string;
    const lowStock = req.query.lowStock as string;

    const productWhere: Record<string, unknown> = {};
    if (search) {
      productWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const stockWhere: Record<string, unknown> = {};
    if (lowStock === 'true') {
      stockWhere.quantity = { lte: 10 };
    }

    const [stock, total] = await Promise.all([
      prisma.stock.findMany({
        where: {
          ...stockWhere,
          product: Object.keys(productWhere).length > 0 ? productWhere : undefined,
        },
        skip,
        take,
        include: {
          product: {
            include: { category: true, brand: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.stock.count({
        where: {
          ...stockWhere,
          product: Object.keys(productWhere).length > 0 ? productWhere : undefined,
        },
      }),
    ]);

    sendPaginated(res, stock, total, currentPage, lmt);
  } catch (error) {
    next(error);
  }
};

export const getProductStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stock = await prisma.stock.findUnique({
      where: { productId: req.params.productId as string },
      include: {
        product: {
          include: { category: true, brand: true },
        },
      },
    });
    if (!stock) throw new NotFoundError('Stock');
    sendSuccess(res, stock);
  } catch (error) {
    next(error);
  }
};

export const adjustStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, type, quantity, reason, reference } = req.body;
    const userId = req.user!.userId;
    const branchId = req.body.branchId;

    const result = await inventoryService.adjustStock(
      productId,
      type,
      quantity,
      reason,
      reference,
      userId,
      branchId,
    );

    sendCreated(res, result, 'Stock adjusted successfully');
  } catch (error) {
    next(error);
  }
};

export const listMovements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { skip, take, page: currentPage, limit: lmt } = paginate(
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 20,
    );
    const productId = req.query.productId as string;
    const type = req.query.type as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: Record<string, unknown> = {
      ...buildDateFilter(startDate, endDate),
    };
    if (productId) where.productId = productId;
    if (type) where.type = type;

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take,
        include: { product: { select: { id: true, name: true, sku: true } }, user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    sendPaginated(res, movements, total, currentPage, lmt);
  } catch (error) {
    next(error);
  }
};

export const listAdjustments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { skip, take, page: currentPage, limit: lmt } = paginate(
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 20,
    );
    const type = req.query.type as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: Record<string, unknown> = {
      ...buildDateFilter(startDate, endDate),
    };
    if (type) where.type = type;

    const [adjustments, total] = await Promise.all([
      prisma.stockAdjustment.findMany({
        where,
        skip,
        take,
        include: { product: { select: { id: true, name: true, sku: true } }, user: { select: { id: true, firstName: true, lastName: true } }, branch: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockAdjustment.count({ where }),
    ]);

    sendPaginated(res, adjustments, total, currentPage, lmt);
  } catch (error) {
    next(error);
  }
};
