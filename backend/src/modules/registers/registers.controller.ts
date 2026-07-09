import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, sendCreated } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = req.query.branchId as string;
    const where: Record<string, unknown> = {};
    if (branchId) where.branchId = branchId;

    const registers = await prisma.register.findMany({
      where,
      include: { branch: true },
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, registers);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const register = await prisma.register.findUnique({
      where: { id: req.params.id as string },
      include: { branch: true },
    });
    if (!register) throw new NotFoundError('Register');
    sendSuccess(res, register);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const register = await prisma.register.create({
      data: req.body,
      include: { branch: true },
    });
    sendCreated(res, register);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const register = await prisma.register.update({
      where: { id: req.params.id as string },
      data: req.body,
      include: { branch: true },
    });
    sendSuccess(res, register, 'Register updated');
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.register.update({
      where: { id: req.params.id as string },
      data: { isActive: false },
    });
    sendSuccess(res, null, 'Register deactivated');
  } catch (error) {
    next(error);
  }
};
