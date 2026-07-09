import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import * as controller from './reports.controller';

const router = Router();
router.use(authenticate);

const reportsAccess = authorize('Admin', 'Manager', 'Accountant');

router.get('/sales', reportsAccess, controller.getSalesReport);
router.get('/inventory', reportsAccess, controller.getInventoryReport);
router.get('/profit', reportsAccess, controller.getProfitReport);
router.get('/tax', reportsAccess, controller.getTaxReport);
router.get('/audit-log', authorize('Admin'), controller.getAuditLog);

export default router;
