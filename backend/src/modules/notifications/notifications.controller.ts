import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import { paginate } from '../../utils/helpers';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page: pageStr, limit: limitStr } = req.query;
    const { skip, take, page, limit } = paginate(parseInt(pageStr as string) || 1, parseInt(limitStr as string) || 20);

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user!.userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId: req.user!.userId } }),
    ]);

    sendPaginated(res, notifications, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user!.userId, isRead: false },
    });
    sendSuccess(res, { count });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id as string, userId: req.user!.userId },
    });
    if (!notification) throw new NotFoundError('Notification');

    await prisma.notification.update({
      where: { id: req.params.id as string },
      data: { isRead: true },
    });
    sendSuccess(res, null, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true },
    });
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id as string, userId: req.user!.userId },
    });
    if (!notification) throw new NotFoundError('Notification');

    await prisma.notification.delete({
      where: { id: req.params.id as string },
    });
    sendSuccess(res, null, 'Notification deleted');
  } catch (error) {
    next(error);
  }
};
