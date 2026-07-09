import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export const auditLog = (action: string, resource: string) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const originalSend = _res.json.bind(_res);
    _res.json = function (body: unknown) {
      try {
        prisma.auditLog.create({
          data: {
            userId: req.user?.userId,
            action,
            resource,
            resourceId: (req.params.id as string) || ((body as Record<string, unknown>)?.id as string) || undefined,
            details: {
              method: req.method,
              path: req.path,
              body: sanitizeBody(req.body),
            } as Prisma.InputJsonValue,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          },
        }).catch((err: Error) => logger.warn({ err }, 'Audit log failed'));
      } catch {
        // silent
      }
      return originalSend(body);
    } as Response['json'];
    next();
  };
};

function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  if (!body) return {};
  const sanitized = { ...body };
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.refreshToken;
  return sanitized;
}
