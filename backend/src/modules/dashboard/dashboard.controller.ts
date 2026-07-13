import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess } from '../../utils/response';

export const getSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchFilter = req.user!.branchId ? { branchId: req.user!.branchId } : {};
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const dateFilter = { createdAt: { gte: todayStart, lte: todayEnd } };

    const [todaySales, revenue, expenses, lowStockCount] = await Promise.all([
      prisma.sale.count({
        where: { ...branchFilter, ...dateFilter, status: 'COMPLETED' },
      }),
      prisma.sale.aggregate({
        _sum: { total: true },
        where: { ...branchFilter, ...dateFilter, status: 'COMPLETED' },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { ...branchFilter, date: { gte: todayStart, lte: todayEnd } },
      }),
      (async () => {
        const stocks = await prisma.stock.findMany({
          where: { product: { ...branchFilter, isActive: true, trackStock: true } },
          select: { quantity: true, minStock: true },
        });
        return stocks.filter(s => s.quantity <= s.minStock).length;
      })(),
    ]);

    sendSuccess(res, {
      salesCount: todaySales,
      revenue: revenue._sum.total || 0,
      expenses: expenses._sum.amount || 0,
      lowStockCount,
    });
  } catch (error) {
    next(error);
  }
};

export const getSalesChart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || '7d';
    const days = period === '30d' ? 30 : 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const branchFilter = req.user!.branchId ? { branchId: req.user!.branchId } : {};

    const sales = await prisma.sale.findMany({
      where: {
        ...branchFilter,
        createdAt: { gte: startDate },
        status: 'COMPLETED',
      },
      select: {
        total: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const chartData: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const key = date.toISOString().split('T')[0];
      chartData[key] = 0;
    }

    for (const sale of sales) {
      const key = sale.createdAt.toISOString().split('T')[0];
      if (chartData[key] !== undefined) {
        chartData[key] += Number(sale.total);
      }
    }

    const result = Object.entries(chartData).map(([date, total]) => ({
      date,
      total: Math.round(total * 100) / 100,
    }));

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getTopProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchFilter = req.user!.branchId ? { sale: { branchId: req.user!.branchId } } : {};

    const topProducts = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: {
        ...branchFilter,
        sale: { status: 'COMPLETED' },
      },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    const productIds = topProducts.map(p => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, sellingPrice: true, image: true },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    const result = topProducts.map(p => ({
      product: productMap.get(p.productId) || null,
      totalQuantity: p._sum.quantity || 0,
    }));

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getRecentSales = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchFilter = req.user!.branchId ? { branchId: req.user!.branchId } : {};

    const sales = await prisma.sale.findMany({
      where: { ...branchFilter, status: 'COMPLETED' },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, sku: true } } },
        },
        customer: { select: { id: true, name: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    sendSuccess(res, sales);
  } catch (error) {
    next(error);
  }
};
