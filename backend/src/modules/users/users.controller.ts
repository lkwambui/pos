import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import bcrypt from 'bcryptjs';
import { config } from '../../config/app';
import { sendSuccess, sendPaginated, sendCreated } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { role: true, branch: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const sanitized = users.map(({ password, refreshToken, resetToken, resetTokenExpiry, ...u }) => u);
    sendPaginated(res, sanitized, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id as string },
      include: { role: { include: { permissions: true } }, branch: true },
    });
    if (!user) throw new NotFoundError('User');
    const { password, refreshToken, resetToken, resetTokenExpiry, ...userWithoutSensitive } = user;
    sendSuccess(res, userWithoutSensitive);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, config.bcrypt.saltRounds);
    const user = await prisma.user.create({
      data: { ...req.body, password: hashedPassword },
      include: { role: true },
    });
    const { password, refreshToken, resetToken, resetTokenExpiry, ...u } = user;
    sendCreated(res, u);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updateData = { ...req.body };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, config.bcrypt.saltRounds);
    }
    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: updateData,
      include: { role: true },
    });
    const { password, refreshToken, resetToken, resetTokenExpiry, ...u } = user;
    sendSuccess(res, u, 'User updated');
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.user.update({
      where: { id: req.params.id as string },
      data: { isActive: false },
    });
    sendSuccess(res, null, 'User deactivated');
  } catch (error) {
    next(error);
  }
};
