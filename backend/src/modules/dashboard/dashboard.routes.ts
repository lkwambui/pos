import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './dashboard.controller';

const router = Router();
router.use(authenticate);

router.get('/summary', controller.getSummary);
router.get('/sales-chart', controller.getSalesChart);
router.get('/top-products', controller.getTopProducts);
router.get('/recent-sales', controller.getRecentSales);

export default router;
