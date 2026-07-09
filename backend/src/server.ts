import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config/app';
import prisma from './config/database';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';
import { setupSwagger } from './utils/swagger';

const RESOURCES = [
  'auth', 'users', 'roles', 'categories', 'brands', 'products',
  'customers', 'suppliers', 'branches', 'registers', 'sales',
  'payments', 'invoices', 'purchases', 'quotations', 'returns',
  'expenses', 'inventory', 'discounts', 'tax-rates', 'notifications',
  'settings', 'dashboard', 'reports', 'etims',
];

const ACTIONS = ['create', 'read', 'update', 'delete'];

async function seedDatabase() {
  const existingRoles = await prisma.role.findMany();
  if (existingRoles.length > 0) return;

  logger.info('Seeding database...');

  const adminRole = await prisma.role.create({
    data: { name: 'Admin', description: 'Full system access' },
  });

  await prisma.role.create({ data: { name: 'Manager', description: 'Branch management access' } });
  await prisma.role.create({ data: { name: 'Cashier', description: 'Point of sale operations' } });
  await prisma.role.create({ data: { name: 'Accountant', description: 'Financial management' } });
  await prisma.role.create({ data: { name: 'InventoryManager', description: 'Stock management' } });

  const adminPermissions = RESOURCES.flatMap(resource =>
    ACTIONS.map(action => ({
      roleId: adminRole.id,
      action,
      resource,
    }))
  );

  await prisma.permission.createMany({ data: adminPermissions });

  const hashedPassword = await bcrypt.hash('Admin123!', config.bcrypt.saltRounds);
  await prisma.user.create({
    data: {
      email: 'admin@swiftpos.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      roleId: adminRole.id,
    },
  });

  logger.info('Database seeded successfully');
}

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use(limiter);

setupSwagger(app);

app.use(config.app.apiPrefix, routes);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    await seedDatabase();

    app.listen(config.app.port, () => {
      logger.info({ port: config.app.port, env: config.app.env }, `${config.app.name} server started`);
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
};

start();

const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, 'Shutdown signal received');
  await prisma.$disconnect();
  logger.info('Database disconnected');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
