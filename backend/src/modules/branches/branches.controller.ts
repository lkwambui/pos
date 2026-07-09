import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, sendCreated } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import { slugify } from '../../utils/helpers';

export const list = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, branches);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branch = await prisma.branch.findUnique({
      where: { id: req.params.id as string },
      include: { registers: true, users: true },
    });
    if (!branch) throw new NotFoundError('Branch');
    sendSuccess(res, branch);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: Record<string, unknown> = { ...req.body };
    if (!data.code) {
      data.code = slugify(req.body.name as string).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
    }
    const branch = await prisma.branch.create({ data: data as any });
    sendCreated(res, branch);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branch = await prisma.branch.update({
      where: { id: req.params.id as string },
      data: req.body,
    });
    sendSuccess(res, branch, 'Branch updated');
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.branch.update({
      where: { id: req.params.id as string },
      data: { isActive: false },
    });
    sendSuccess(res, null, 'Branch deactivated');
  } catch (error) {
    next(error);
  }
};
