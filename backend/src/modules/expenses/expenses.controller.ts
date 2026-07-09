import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, sendPaginated, sendCreated } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import { paginate, buildDateFilter } from '../../utils/helpers';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { skip, take } = paginate(page, limit);
    const categoryId = req.query.categoryId as string;
    const branchId = req.query.branchId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: Record<string, unknown> = {};
    if (categoryId) where.categoryId = categoryId;
    if (branchId) where.branchId = branchId;

    const dateFilter = buildDateFilter(startDate, endDate);
    if (Object.keys(dateFilter).length) where.date = dateFilter;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take,
        include: { category: true, branch: true, user: true },
        orderBy: { date: 'desc' },
      }),
      prisma.expense.count({ where }),
    ]);

    sendPaginated(res, expenses, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.id as string },
      include: { category: true, branch: true, user: true },
    });
    if (!expense) throw new NotFoundError('Expense');
    sendSuccess(res, expense);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expense = await prisma.expense.create({
      data: {
        ...req.body,
        date: new Date(req.body.date),
        userId: req.user!.userId,
      },
      include: { category: true, branch: true, user: true },
    });
    sendCreated(res, expense);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updateData: Record<string, unknown> = { ...req.body };
    if (updateData.date) {
      updateData.date = new Date(updateData.date as string);
    }
    const expense = await prisma.expense.update({
      where: { id: req.params.id as string },
      data: updateData,
      include: { category: true, branch: true, user: true },
    });
    sendSuccess(res, expense, 'Expense updated');
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.expense.delete({ where: { id: req.params.id as string } });
    sendSuccess(res, null, 'Expense deleted');
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { expenses: true } } },
    });
    sendSuccess(res, categories);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await prisma.expenseCategory.create({
      data: req.body,
    });
    sendCreated(res, category);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await prisma.expenseCategory.update({
      where: { id: req.params.id as string },
      data: req.body,
    });
    sendSuccess(res, category, 'Category updated');
  } catch (error) {
    next(error);
  }
};
