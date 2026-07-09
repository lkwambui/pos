import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { buildDateFilter, paginate } from '../../utils/helpers';

export const getSalesReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, branchId } = req.query;
    const dateFilter = buildDateFilter(startDate as string, endDate as string);

    const where: Record<string, unknown> = {
      ...dateFilter,
      status: 'COMPLETED',
    };
    if (branchId) where.branchId = branchId as string;

    const sales = await prisma.sale.findMany({
      where,
      include: {
        items: true,
        branch: { select: { id: true, name: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const dailyMap: Record<string, { count: number; revenue: number; tax: number; discount: number }> = {};
    for (const sale of sales) {
      const key = sale.createdAt.toISOString().split('T')[0];
      if (!dailyMap[key]) {
        dailyMap[key] = { count: 0, revenue: 0, tax: 0, discount: 0 };
      }
      dailyMap[key].count += 1;
      dailyMap[key].revenue += Number(sale.total);
      dailyMap[key].tax += Number(sale.taxAmount);
      dailyMap[key].discount += Number(sale.discount);
    }

    const dailySummary = Object.entries(dailyMap).map(([date, data]) => ({
      date,
      ...data,
      revenue: Math.round(data.revenue * 100) / 100,
      tax: Math.round(data.tax * 100) / 100,
      discount: Math.round(data.discount * 100) / 100,
    }));

    sendSuccess(res, {
      sales: sales.length,
      totalRevenue: Math.round(sales.reduce((s, x) => s + Number(x.total), 0) * 100) / 100,
      dailySummary,
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryReport = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [stockItems, lowStockItems, outOfStockCount, totalProducts] = await Promise.all([
      prisma.stock.findMany({
        include: {
          product: { select: { id: true, name: true, sku: true, purchasePrice: true, sellingPrice: true, isActive: true } },
        },
        where: { product: { isActive: true } },
      }),
      (async () => {
        const all = await prisma.stock.findMany({
          where: { product: { isActive: true, trackStock: true } },
          include: {
            product: { select: { id: true, name: true, sku: true, purchasePrice: true, sellingPrice: true, lowStockLevel: true } },
          },
        });
        return all.filter(s => s.quantity > 0 && s.quantity <= s.minStock);
      })(),
      prisma.stock.count({
        where: {
          product: { isActive: true, trackStock: true },
          quantity: { lte: 0 },
        },
      }),
      prisma.product.count({ where: { isActive: true } }),
    ]);

    const stockValue = stockItems.reduce((sum, s) => sum + Number(s.product.purchasePrice) * s.quantity, 0);
    const retailValue = stockItems.reduce((sum, s) => sum + Number(s.product.sellingPrice) * s.quantity, 0);

    sendSuccess(res, {
      totalProducts,
      totalStockItems: stockItems.length,
      stockValue: Math.round(stockValue * 100) / 100,
      retailValue: Math.round(retailValue * 100) / 100,
      lowStockCount: lowStockItems.length,
      outOfStockCount,
      lowStockItems,
    });
  } catch (error) {
    next(error);
  }
};

export const getProfitReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate as string, endDate as string);

    const sales = await prisma.sale.findMany({
      where: { ...dateFilter, status: 'COMPLETED' },
      select: {
        total: true,
        discount: true,
        taxAmount: true,
        items: {
          select: {
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            product: {
              select: { purchasePrice: true },
            },
          },
        },
      },
    });

    let totalRevenue = 0;
    let totalCOGS = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    for (const sale of sales) {
      totalRevenue += Number(sale.total);
      totalDiscount += Number(sale.discount);
      totalTax += Number(sale.taxAmount);

      for (const item of sale.items) {
        const costPrice = item.product?.purchasePrice
          ? Number(item.product.purchasePrice)
          : 0;
        totalCOGS += costPrice * item.quantity;
      }
    }

    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalDiscount;

    sendSuccess(res, {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCOGS: Math.round(totalCOGS * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      salesCount: sales.length,
      profitMargin: totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 10000) / 100 : 0,
    });
  } catch (error) {
    next(error);
  }
};

export const getTaxReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate as string, endDate as string);

    const sales = await prisma.sale.findMany({
      where: { ...dateFilter, status: 'COMPLETED' },
      select: {
        total: true,
        taxAmount: true,
        saleNumber: true,
        createdAt: true,
        branch: { select: { id: true, name: true, kraPin: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalVATCollected = sales.reduce((sum, s) => sum + Number(s.taxAmount), 0);

    const byBranch: Record<string, { count: number; vatCollected: number; kraPin?: string }> = {};
    for (const sale of sales) {
      const branchName = sale.branch?.name || 'Unknown';
      if (!byBranch[branchName]) {
        byBranch[branchName] = { count: 0, vatCollected: 0, kraPin: sale.branch?.kraPin || undefined };
      }
      byBranch[branchName].count += 1;
      byBranch[branchName].vatCollected += Number(sale.taxAmount);
    }

    sendSuccess(res, {
      totalSales: sales.length,
      totalVATCollected: Math.round(totalVATCollected * 100) / 100,
      byBranch: Object.entries(byBranch).map(([name, data]) => ({
        branch: name,
        ...data,
        vatCollected: Math.round(data.vatCollected * 100) / 100,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page: pageStr, limit: limitStr, action, userId, startDate, endDate } = req.query;
    const { skip, take, page, limit } = paginate(parseInt(pageStr as string) || 1, parseInt(limitStr as string) || 50);

    const where: Record<string, unknown> = {};
    if (action) where.action = action as string;
    if (userId) where.userId = userId as string;

    const dateFilter = buildDateFilter(startDate as string, endDate as string);
    if (Object.keys(dateFilter).length > 0) {
      where.createdAt = dateFilter.createdAt;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    sendPaginated(res, logs, total, page, limit);
  } catch (error) {
    next(error);
  }
};
