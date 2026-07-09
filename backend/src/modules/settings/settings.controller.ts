import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { Prisma } from '@prisma/client';
import { sendSuccess } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: Record<string, unknown> = {};
    if (req.query.group) {
      where.group = req.query.group as string;
    }
    const settings = await prisma.setting.findMany({
      where,
      orderBy: { key: 'asc' },
    });
    sendSuccess(res, settings);
  } catch (error) {
    next(error);
  }
};

export const getByKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: req.params.key as string },
    });
    if (!setting) throw new NotFoundError('Setting');
    sendSuccess(res, setting);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const setting = await prisma.setting.upsert({
      where: { key: req.params.key as string },
      update: { value: req.body.value, group: req.body.group },
      create: {
        key: req.params.key as string,
        value: req.body.value,
        group: req.body.group || 'general',
      },
    });
    sendSuccess(res, setting, 'Setting saved');
  } catch (error) {
    next(error);
  }
};

export const updateBulk = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pairs = req.body as { key: string; value: unknown; group?: string }[];

    const results = await Promise.all(
      pairs.map(p =>
        prisma.setting.upsert({
          where: { key: p.key },
          update: { value: p.value as Prisma.InputJsonValue, group: p.group },
          create: {
            key: p.key,
            value: p.value as Prisma.InputJsonValue,
            group: p.group || 'general',
          },
        }),
      ),
    );

    sendSuccess(res, results, 'Settings saved');
  } catch (error) {
    next(error);
  }
};
