import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, sendPaginated, sendCreated } from '../../utils/response';
import { paginate } from '../../utils/helpers';
import * as etimsService from './etims.service';

export const getOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const overview = await etimsService.getOverview(req.user?.branchId);
    sendSuccess(res, overview);
  } catch (error) {
    next(error);
  }
};

export const getInvoiceLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await etimsService.getInvoiceLog(page, limit);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const submitInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { saleId } = req.body;
    const result = await etimsService.submitInvoice(saleId);
    sendCreated(res, result, 'Invoice submitted to KRA successfully');
  } catch (error) {
    next(error);
  }
};

export const retryInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await etimsService.retryInvoice(req.params.id as string);
    sendSuccess(res, result, 'Retrying eTIMS submission');
  } catch (error) {
    next(error);
  }
};

export const getSyncLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await etimsService.getSyncLog(page, limit);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchFilter = req.user?.branchId ? { sale: { branchId: req.user.branchId } } : {};

    const [successCount, failedCount, pendingCount] = await Promise.all([
      prisma.eTIMSInvoice.count({ where: { status: 'SUCCESS' } }),
      prisma.eTIMSInvoice.count({ where: { status: 'FAILED' } }),
      prisma.eTIMSInvoice.count({ where: { status: { in: ['PENDING', 'SUBMITTED'] } } }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySuccess = await prisma.eTIMSInvoice.count({
      where: { status: 'SUCCESS', submittedAt: { gte: today } },
    });

    sendSuccess(res, {
      successCount,
      failedCount,
      pendingCount,
      todaySuccess,
      totalCount: successCount + failedCount + pendingCount,
    });
  } catch (error) {
    next(error);
  }
};

export const getSettings = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await etimsService.getSettings();
    sendSuccess(res, settings);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const results = await etimsService.updateSettings(req.body);
    sendSuccess(res, results, 'eTIMS settings updated');
  } catch (error) {
    next(error);
  }
};
