import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, sendCreated } from '../../utils/response';
import { NotFoundError, ConflictError } from '../../utils/errors';

export const list = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const discounts = await prisma.discount.findMany({
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, discounts);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const discount = await prisma.discount.findUnique({
      where: { id: req.params.id as string },
    });
    if (!discount) throw new NotFoundError('Discount');
    sendSuccess(res, discount);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const discount = await prisma.discount.create({
      data: req.body,
    });
    sendCreated(res, discount);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const discount = await prisma.discount.update({
      where: { id: req.params.id as string },
      data: req.body,
    });
    sendSuccess(res, discount, 'Discount updated');
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.discount.update({
      where: { id: req.params.id as string },
      data: { isActive: false },
    });
    sendSuccess(res, null, 'Discount deactivated');
  } catch (error) {
    next(error);
  }
};
