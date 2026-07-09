import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, sendPaginated, sendCreated } from '../../utils/response';
import { NotFoundError, ConflictError } from '../../utils/errors';

export const list = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await prisma.role.findMany({
      include: { permissions: true, _count: { select: { users: true } } },
    });
    sendSuccess(res, roles);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = await prisma.role.findUnique({
      where: { id: req.params.id as string },
      include: { permissions: true, users: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    if (!role) throw new NotFoundError('Role');
    sendSuccess(res, role);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.role.findUnique({ where: { name: req.body.name } });
    if (existing) throw new ConflictError('Role already exists');
    const role = await prisma.role.create({
      data: {
        name: req.body.name,
        description: req.body.description,
        permissions: {
          create: (req.body.permissions || []).map((p: { action: string; resource: string }) => ({
            action: p.action,
            resource: p.resource,
          })),
        },
      },
      include: { permissions: true },
    });
    sendCreated(res, role);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = await prisma.role.update({
      where: { id: req.params.id as string },
      data: {
        name: req.body.name,
        description: req.body.description,
      },
      include: { permissions: true },
    });
    sendSuccess(res, role, 'Role updated');
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.role.delete({ where: { id: req.params.id as string } });
    sendSuccess(res, null, 'Role deleted');
  } catch (error) {
    next(error);
  }
};

export const updatePermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.permission.deleteMany({ where: { roleId: req.params.id as string } });
    const permissions = await prisma.permission.createMany({
      data: (req.body.permissions || []).map((p: { action: string; resource: string }) => ({
        roleId: req.params.id as string,
        action: p.action,
        resource: p.resource,
      })),
    });
    sendSuccess(res, permissions, 'Permissions updated');
  } catch (error) {
    next(error);
  }
};
