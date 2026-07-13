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
    const existingUsers = await prisma.user.findMany();
    const existingProducts = await prisma.product.findMany();
    if (existingUsers.length > 0 && existingProducts.length > 0) {
      logger.info('Database already fully seeded, skipping');
      return;
    }
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

  const branch = await prisma.branch.create({
    data: {
      name: 'Main Branch',
      code: 'HQ',
      isActive: true,
    },
  });

  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Groceries', slug: 'groceries' } }),
    prisma.category.create({ data: { name: 'Dairy', slug: 'dairy' } }),
    prisma.category.create({ data: { name: 'Beverages', slug: 'beverages' } }),
    prisma.category.create({ data: { name: 'Household', slug: 'household' } }),
    prisma.category.create({ data: { name: 'Personal Care', slug: 'personal-care' } }),
    prisma.category.create({ data: { name: 'Confectionery', slug: 'confectionery' } }),
  ]);

  const brands = await Promise.all([
    prisma.brand.create({ data: { name: 'Jogoo', slug: 'jogoo' } }),
    prisma.brand.create({ data: { name: 'Brookside', slug: 'brookside' } }),
    prisma.brand.create({ data: { name: 'Safaricom', slug: 'safaricom' } }),
    prisma.brand.create({ data: { name: 'Unilever', slug: 'unilever' } }),
    prisma.brand.create({ data: { name: 'GSK', slug: 'gsk' } }),
    prisma.brand.create({ data: { name: 'Ketepa', slug: 'ketepa' } }),
    prisma.brand.create({ data: { name: 'Indomie', slug: 'indomie' } }),
    prisma.brand.create({ data: { name: 'EABL', slug: 'eabl' } }),
    prisma.brand.create({ data: { name: 'Cadbury', slug: 'cadbury' } }),
    prisma.brand.create({ data: { name: 'P&G', slug: 'p-g' } }),
  ]);

  const productsData = [
    { name: 'Equity Bank Maize Flour 2kg', sku: 'MF-EQ-2KG', barcode: '6001234567890', sellingPrice: 285, purchasePrice: 240, categoryIndex: 0, brandIndex: 0, vatRate: 16, stock: 142 },
    { name: 'Brookside Fresh Milk 500ml', sku: 'BRK-FM-500', barcode: '6009876543210', sellingPrice: 75, purchasePrice: 60, categoryIndex: 1, brandIndex: 1, vatRate: 0, stock: 88 },
    { name: 'Safaricom Airtime KES 100', sku: 'SAF-AIR-100', barcode: '6007654321098', sellingPrice: 100, purchasePrice: 97, categoryIndex: 2, brandIndex: 2, vatRate: 16, stock: 999 },
    { name: 'Omo Washing Powder 1kg', sku: 'OMO-WP-1KG', barcode: '6002345678901', sellingPrice: 420, purchasePrice: 360, categoryIndex: 3, brandIndex: 3, vatRate: 16, stock: 67 },
    { name: 'Sensodyne Toothpaste 100g', sku: 'SEN-TP-100', barcode: '6003456789012', sellingPrice: 380, purchasePrice: 320, categoryIndex: 4, brandIndex: 4, vatRate: 16, stock: 23 },
    { name: 'Ketepa Pride Tea Bags 50s', sku: 'KET-TB-050', barcode: '6004567890123', sellingPrice: 195, purchasePrice: 160, categoryIndex: 2, brandIndex: 5, vatRate: 16, stock: 115 },
    { name: 'Indomie Noodles Chicken 70g', sku: 'IND-NC-070', barcode: '6005678901234', sellingPrice: 35, purchasePrice: 28, categoryIndex: 0, brandIndex: 6, vatRate: 16, stock: 340 },
    { name: 'Dettol Antibacterial Soap', sku: 'DET-AS-125', barcode: '6006789012345', sellingPrice: 165, purchasePrice: 130, categoryIndex: 4, brandIndex: 3, vatRate: 16, stock: 78 },
    { name: 'Tusker Malt Lager 500ml', sku: 'TUS-ML-500', barcode: '6007890123456', sellingPrice: 250, purchasePrice: 200, categoryIndex: 2, brandIndex: 7, vatRate: 16, stock: 0 },
    { name: 'Cadbury Dairy Milk 90g', sku: 'CAD-DM-090', barcode: '6008901234567', sellingPrice: 195, purchasePrice: 160, categoryIndex: 5, brandIndex: 8, vatRate: 16, stock: 56 },
    { name: 'Pishori Rice 2kg', sku: 'PSH-RI-2KG', barcode: '6009012345678', sellingPrice: 650, purchasePrice: 550, categoryIndex: 0, brandIndex: 0, vatRate: 0, stock: 92 },
    { name: 'Ariel Liquid Detergent 1L', sku: 'ARI-LD-1LT', barcode: '6000123456789', sellingPrice: 510, purchasePrice: 430, categoryIndex: 3, brandIndex: 9, vatRate: 16, stock: 44 },
  ];

  const products = await Promise.all(
    productsData.map(p =>
      prisma.product.create({
        data: {
          name: p.name,
          slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          sku: p.sku,
          barcode: p.barcode,
          sellingPrice: p.sellingPrice,
          purchasePrice: p.purchasePrice,
          vatRate: p.vatRate,
          categoryId: categories[p.categoryIndex].id,
          brandId: brands[p.brandIndex].id,
          branchId: branch.id,
          isService: false,
          trackStock: true,
          lowStockLevel: 10,
        },
      })
    ),
  );

  for (const product of products) {
    const stockData = productsData.find(p => p.sku === product.sku);
    await prisma.stock.create({
      data: {
        productId: product.id,
        quantity: stockData?.stock || 0,
        minStock: 10,
      },
    });
  }

  const customers = await Promise.all([
    prisma.customer.create({ data: { name: 'Wanjiku Enterprises', phone: '+254712345678', email: 'wanjiku@enterprises.co.ke', kraPin: 'A001234567B', creditLimit: 45000, branchId: branch.id } }),
    prisma.customer.create({ data: { name: 'John Kamau', phone: '+254722987654', email: 'jkamau@gmail.com', branchId: branch.id } }),
    prisma.customer.create({ data: { name: 'Nairobi Hardware Ltd', phone: '+254733456789', email: 'info@nairobihard.co.ke', kraPin: 'P002345678D', creditLimit: 250000, branchId: branch.id } }),
    prisma.customer.create({ data: { name: 'Grace Muthoni', phone: '+254741234567', email: 'grace.m@yahoo.com', branchId: branch.id } }),
    prisma.customer.create({ data: { name: 'Otieno & Sons Suppliers', phone: '+254756789012', email: 'otieno@sons.co.ke', kraPin: 'P004567890F', creditLimit: 120000, branchId: branch.id } }),
  ]);

  await Promise.all([
    prisma.supplier.create({ data: { name: 'Bidco Africa Ltd', phone: '+254711111111', email: 'info@bidco.co.ke', kraPin: 'P005678901G', branchId: branch.id } }),
    prisma.supplier.create({ data: { name: 'Coca-Cola Kenya', phone: '+254722222222', email: 'orders@cocacola.co.ke', branchId: branch.id } }),
    prisma.supplier.create({ data: { name: 'Unilever Kenya', phone: '+254733333333', email: 'supply@unilever.co.ke', branchId: branch.id } }),
  ]);

  logger.info('Database seeding completed successfully');
}

main()
  .catch((error) => {
    logger.error({ error }, 'Seed failed');
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
