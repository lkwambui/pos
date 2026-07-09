import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { config } from '../config/app';
import { logger } from '../utils/logger';

const RESOURCES = [
  'auth', 'users', 'roles', 'categories', 'brands', 'products',
  'customers', 'suppliers', 'branches', 'registers', 'sales',
  'payments', 'invoices', 'purchases', 'quotations', 'returns',
  'expenses', 'inventory', 'discounts', 'tax-rates', 'notifications',
  'settings', 'dashboard', 'reports', 'etims',
];

const ACTIONS = ['create', 'read', 'update', 'delete'];

async function main() {
  logger.info('Seeding database...');

  const existingRoles = await prisma.role.findMany();
  if (existingRoles.length > 0) {
    logger.info('Database already seeded, skipping');
    return;
  }

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

  const hashedPassword = await bcrypt.hash('password123', config.bcrypt.saltRounds);

  await prisma.user.create({
    data: {
      email: 'admin@swiftpos.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Admin',
      roleId: adminRole.id,
      isVerified: true,
    },
  });

  await prisma.taxRate.createMany({
    data: [
      { name: 'VAT 16%', rate: 16 },
      { name: 'VAT 8%', rate: 8 },
      { name: 'Zero Rated', rate: 0 },
      { name: 'Exempt', rate: 0 },
    ],
  });

  await prisma.expenseCategory.createMany({
    data: [
      { name: 'Rent', description: 'Rent payments' },
      { name: 'Utilities', description: 'Electricity, water, internet' },
      { name: 'Salaries', description: 'Employee salaries' },
      { name: 'Maintenance', description: 'Repairs and maintenance' },
      { name: 'Marketing', description: 'Advertising and promotions' },
      { name: 'Transport', description: 'Logistics and delivery' },
      { name: 'Office Supplies', description: 'Stationery and supplies' },
      { name: 'Other', description: 'Miscellaneous expenses' },
    ],
  });

  await prisma.setting.createMany({
    data: [
      { key: 'business.name', value: '"SwiftPOS"', group: 'business' },
      { key: 'business.currency', value: '"KES"', group: 'business' },
      { key: 'receipt.footer', value: '"Thank you for your business!"', group: 'receipt' },
      { key: 'tax.default', value: '16', group: 'tax' },
    ],
  });

  await prisma.branch.create({
    data: {
      name: 'Main Branch',
      code: 'HQ',
      isActive: true,
    },
  });

  logger.info('Database seeding completed successfully');
}

main()
  .catch((error) => {
    logger.error({ error }, 'Seed failed');
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
