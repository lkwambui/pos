import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, sendPaginated, sendCreated } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import { slugify, paginate } from '../../utils/helpers';
import * as productsService from './products.service';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { skip, take, page: currentPage, limit: lmt } = paginate(
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 20,
    );
    const search = req.query.search as string;
    const categoryId = req.query.categoryId as string;
    const brandId = req.query.brandId as string;
    const branchId = req.query.branchId as string;
    const isActive = req.query.isActive as string;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (branchId) where.branchId = branchId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        include: { category: true, brand: true, stock: true, variants: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    sendPaginated(res, products, total, currentPage, lmt);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id as string },
      include: { category: true, brand: true, stock: true, variants: true },
    });
    if (!product) throw new NotFoundError('Product');
    sendSuccess(res, product);
  } catch (error) {
    next(error);
  }
};

export const getByBarcode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findUnique({
      where: { barcode: req.params.barcode as string },
      include: { category: true, brand: true, stock: true, variants: true },
    });
    if (!product) throw new NotFoundError('Product');
    sendSuccess(res, product);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = {
      ...req.body,
      slug: slugify(req.body.name),
      sku: productsService.generateProductSku(req.body.name),
    };

    delete data.variants;
    const variants = (req.body.variants || []) as { name: string; sku?: string; price?: number; cost?: number; stock?: number; lowStockLevel?: number; barcode?: string }[];

    const product = await prisma.product.create({
      data: {
        ...data,
        variants: variants.length > 0 ? { create: variants } : undefined,
      },
      include: { category: true, brand: true, stock: true, variants: true },
    });

    if (product.trackStock && req.body.initialStock) {
      await productsService.updateStockOnCreate(product.id, req.body.initialStock);
    }

    sendCreated(res, product);
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
    delete updateData.variants;

    const product = await prisma.product.update({
      where: { id: req.params.id as string },
      data: updateData,
      include: { category: true, brand: true, stock: true, variants: true },
    }) as any;

    if (product.trackStock && req.body.initialStock && !product.stock) {
      await productsService.updateStockOnCreate(product.id, req.body.initialStock);
    }

    sendSuccess(res, product, 'Product updated');
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.product.update({
      where: { id: req.params.id as string },
      data: { isActive: false },
    });
    sendSuccess(res, null, 'Product deactivated');
  } catch (error) {
    next(error);
  }
};
