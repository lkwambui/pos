import { Router } from 'express';

import authRoutes from '../modules/auth/auth.routes';
import usersRoutes from '../modules/users/users.routes';
import rolesRoutes from '../modules/roles/roles.routes';
import categoriesRoutes from '../modules/categories/categories.routes';
import brandsRoutes from '../modules/brands/brands.routes';
import productsRoutes from '../modules/products/products.routes';
import customersRoutes from '../modules/customers/customers.routes';
import suppliersRoutes from '../modules/suppliers/suppliers.routes';
import branchesRoutes from '../modules/branches/branches.routes';
import registersRoutes from '../modules/registers/registers.routes';
import salesRoutes from '../modules/sales/sales.routes';
import paymentsRoutes from '../modules/payments/payments.routes';
import invoicesRoutes from '../modules/invoices/invoices.routes';
import purchasesRoutes from '../modules/purchases/purchases.routes';
import quotationsRoutes from '../modules/quotations/quotations.routes';
import returnsRoutes from '../modules/returns/returns.routes';
import expensesRoutes from '../modules/expenses/expenses.routes';
import inventoryRoutes from '../modules/inventory/inventory.routes';
import discountsRoutes from '../modules/discounts/discounts.routes';
import taxRatesRoutes from '../modules/tax-rates/taxRates.routes';
import notificationsRoutes from '../modules/notifications/notifications.routes';
import settingsRoutes from '../modules/settings/settings.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import reportsRoutes from '../modules/reports/reports.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'SwiftPOS API is running', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/roles', rolesRoutes);
router.use('/categories', categoriesRoutes);
router.use('/brands', brandsRoutes);
router.use('/products', productsRoutes);
router.use('/customers', customersRoutes);
router.use('/suppliers', suppliersRoutes);
router.use('/branches', branchesRoutes);
router.use('/registers', registersRoutes);
router.use('/sales', salesRoutes);
router.use('/payments', paymentsRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/purchases', purchasesRoutes);
router.use('/quotations', quotationsRoutes);
router.use('/returns', returnsRoutes);
router.use('/expenses', expensesRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/discounts', discountsRoutes);
router.use('/tax-rates', taxRatesRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/settings', settingsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportsRoutes);

export default router;
