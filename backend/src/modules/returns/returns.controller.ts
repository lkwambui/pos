import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, sendPaginated, sendCreated } from '../../utils/response';
import { AppError, NotFoundError } from '../../utils/errors';
import { generateReturnNumber, paginate, buildDateFilter } from '../../utils/helpers';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { skip, take } = paginate(page, limit);
    const search = req.query.search as string;
    const status = req.query.status as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: Record<string, unknown> = {};
    if (search) {
      where.returnNumber = { contains: search, mode: 'insensitive' };
    }
    if (status) where.status = status;

    const dateFilter = buildDateFilter(startDate, endDate);
    if (Object.keys(dateFilter).length) where.createdAt = dateFilter;

    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        where,
        skip,
        take,
        include: { sale: true, customer: true, user: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.return.count({ where }),
    ]);

    sendPaginated(res, returns, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const returnRecord = await prisma.return.findUnique({
      where: { id: req.params.id as string },
      include: { sale: { include: { items: { include: { product: true } } } }, customer: true, user: true },
    });
    if (!returnRecord) throw new NotFoundError('Return');
    sendSuccess(res, returnRecord);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const returnNumber = generateReturnNumber();

    const data: Record<string, unknown> = {
      returnNumber,
      userId: req.user!.userId,
      reason: req.body.reason,
      total: req.body.total || 0,
    };
    if (req.body.saleId) data.saleId = req.body.saleId;
    if (req.body.customerId) data.customerId = req.body.customerId;

    const returnRecord = await prisma.return.create({
      data: data as any,
      include: { sale: true, customer: true, user: true },
    });

    sendCreated(res, returnRecord);
  } catch (error) {
    next(error);
  }
};

export const approve = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const returnRecord = await prisma.return.findUnique({
      where: { id: req.params.id as string },
      include: { sale: { include: { items: { include: { product: true } } } } },
    }) as any;

    if (!returnRecord) throw new NotFoundError('Return');
    if (returnRecord.status !== 'PENDING') throw new AppError('Return is not in PENDING status', 400);

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.return.update({
        where: { id: req.params.id as string },
        data: { status: 'APPROVED' },
      });

      if (returnRecord.sale) {
        for (const item of returnRecord.sale.items) {
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
              type: 'RETURN',
              quantity: item.quantity,
              balanceBefore: stock.quantity - item.quantity,
              balanceAfter: stock.quantity,
              reference: returnRecord.returnNumber,
              userId: req.user!.userId,
            },
          });
        }

        await tx.sale.update({
          where: { id: returnRecord.sale.id },
          data: { status: 'REFUNDED' },
        });
      }

      return updated;
    });

    sendSuccess(res, result, 'Return approved');
  } catch (error) {
    next(error);
  }
};

export const reject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const returnRecord = await prisma.return.findUnique({ where: { id: req.params.id as string } });
    if (!returnRecord) throw new NotFoundError('Return');
    if (returnRecord.status !== 'PENDING') throw new AppError('Return is not in PENDING status', 400);

    const result = await prisma.return.update({
      where: { id: req.params.id as string },
      data: { status: 'REJECTED' },
    });

    sendSuccess(res, result, 'Return rejected');
  } catch (error) {
    next(error);
  }
};
