import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, sendPaginated, sendCreated } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import { slugify, paginate } from '../../utils/helpers';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { skip, take, page: currentPage, limit: lmt } = paginate(
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 20,
    );
    const search = req.query.search as string;

    const where: Record<string, unknown> = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.brand.count({ where }),
    ]);

    sendPaginated(res, brands, total, currentPage, lmt);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id: req.params.id as string },
      include: { products: true },
    });
    if (!brand) throw new NotFoundError('Brand');
    sendSuccess(res, brand);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = {
      ...req.body,
      slug: slugify(req.body.name),
    };
    const brand = await prisma.brand.create({ data });
    sendCreated(res, brand);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updateData = { ...req.body };
    if (updateData.name) {
      updateData.slug = slugify(updateData.name);
    }
    const brand = await prisma.brand.update({
      where: { id: req.params.id as string },
      data: updateData,
    });
    sendSuccess(res, brand, 'Brand updated');
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.brand.update({
      where: { id: req.params.id as string },
      data: { isActive: false },
    });
    sendSuccess(res, null, 'Brand deactivated');
  } catch (error) {
    next(error);
  }
};
