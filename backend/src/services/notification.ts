import prisma from '../config/database';
import { logger } from '../utils/logger';

export const createNotification = async (
  userId: string | undefined,
  type: string,
  title: string,
  message: string,
  link?: string,
) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: userId || null,
        type,
        title,
        message,
        link,
      },
    });
    return notification;
  } catch (error) {
    logger.error({ error, type, title }, 'Failed to create notification');
    return null;
  }
};

export const notifyLowStock = async (productId: string, productName: string, quantity: number) => {
  const title = 'Low Stock Alert';
  const message = `${productName} is running low. Current stock: ${quantity}`;

  const users = await prisma.user.findMany({
    where: {
      role: { name: { in: ['Admin', 'InventoryManager'] } },
      isActive: true,
    },
  });

  for (const user of users) {
    await createNotification(user.id, 'LOW_STOCK', title, message, `/products/${productId}`);
  }
};

export const notifyETIMS = async (userId: string | undefined, status: string, message: string) => {
  const type = status === 'SUCCESS' ? 'ETIMS_SUCCESS' : 'ETIMS_FAILED';
  const title = status === 'SUCCESS' ? 'eTIMS Sync Successful' : 'eTIMS Sync Failed';

  await createNotification(userId, type, title, message);
};
