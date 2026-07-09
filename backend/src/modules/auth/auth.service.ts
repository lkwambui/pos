import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/database';
import { config } from '../../config/app';
import { AppError, UnauthorizedError, NotFoundError, ConflictError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { sendPasswordResetEmail } from '../../services/email';
import type { JwtPayload } from '../../middleware/auth';

const generateTokens = (payload: JwtPayload) => {
  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
  return { accessToken, refreshToken };
};

export const login = async (email: string, password: string, ipAddress: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      role: {
        include: { permissions: true },
      },
    },
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role.name,
    permissions: user.role.permissions.map(p => `${p.action}:${p.resource}`),
  };

  const tokens = generateTokens(payload);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  await prisma.session.create({
    data: {
      userId: user.id,
      token: tokens.refreshToken,
      ipAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      resource: 'auth',
      ipAddress,
    },
  });

  const { password: _, refreshToken: _r, resetToken: _rt, resetTokenExpiry: _rte, ...userWithoutSensitive } = user;
  return { user: userWithoutSensitive, ...tokens };
};

export const register = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId?: string;
  branchId?: string;
}) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ConflictError('Email already registered');

  const hashedPassword = await bcrypt.hash(data.password, config.bcrypt.saltRounds);

  let roleId = data.roleId;
  if (!roleId) {
    const cashierRole = await prisma.role.findUnique({ where: { name: 'Cashier' } });
    roleId = cashierRole?.id;
  }

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      roleId: roleId || '',
      branchId: data.branchId,
    },
    include: { role: true },
  });

  const { password: _, refreshToken: _r, resetToken: _rt, resetTokenExpiry: _rte, ...userWithoutSensitive } = user;
  return userWithoutSensitive;
};

export const refreshToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: { include: { permissions: true } } },
    });

    if (!user || !user.isActive || user.refreshToken !== token) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role.name,
      permissions: user.role.permissions.map(p => `${p.action}:${p.resource}`),
    };

    const tokens = generateTokens(payload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return tokens;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
};

export const logout = async (userId: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
  await prisma.session.deleteMany({ where: { userId } });
};

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const resetToken = uuidv4();
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry },
  });

  await sendPasswordResetEmail(user.email, resetToken, config.app.url);
  logger.info({ resetToken, email }, 'Password reset token generated');
};

export const resetPassword = async (token: string, newPassword: string) => {
  const user = await prisma.user.findFirst({
    where: { resetToken: token, resetTokenExpiry: { gte: new Date() } },
  });

  if (!user) throw new AppError('Invalid or expired reset token', 400);

  const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
      refreshToken: null,
    },
  });
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) throw new AppError('Current password is incorrect', 400);

  const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword, refreshToken: null },
  });
};

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: { include: { permissions: true } },
      branch: true,
    },
  });

  if (!user) throw new NotFoundError('User');

  const { password: _, refreshToken: _r, resetToken: _rt, resetTokenExpiry: _rte, ...userWithoutSensitive } = user;
  return userWithoutSensitive;
};
