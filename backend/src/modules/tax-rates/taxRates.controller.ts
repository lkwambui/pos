import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, sendCreated } from '../../utils/response';
import { NotFoundError, ConflictError } from '../../utils/errors';

export const list = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const taxRates = await prisma.taxRate.findMany({
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, taxRates);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taxRate = await prisma.taxRate.findUnique({
      where: { id: req.params.id as string },
    });
    if (!taxRate) throw new NotFoundError('Tax rate');
    sendSuccess(res, taxRate);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.taxRate.findUnique({ where: { name: req.body.name } });
    if (existing) throw new ConflictError('Tax rate with this name already exists');

    const taxRate = await prisma.taxRate.create({
      data: req.body,
    });
    sendCreated(res, taxRate);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body.name) {
      const existing = await prisma.taxRate.findFirst({
        where: { name: req.body.name, id: { not: req.params.id as string } },
      });
      if (existing) throw new ConflictError('Tax rate with this name already exists');
    }

    const taxRate = await prisma.taxRate.update({
      where: { id: req.params.id as string },
      data: req.body,
    });
    sendSuccess(res, taxRate, 'Tax rate updated');
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.taxRate.update({
      where: { id: req.params.id as string },
      data: { isActive: false },
    });
    sendSuccess(res, null, 'Tax rate deactivated');
  } catch (error) {
    next(error);
  }
};
