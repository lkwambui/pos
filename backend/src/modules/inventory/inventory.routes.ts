import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './inventory.controller';
import { adjustStockSchema } from './inventory.validation';

const router = Router();
router.use(authenticate);

router.get('/', controller.getStock);
router.get('/movements', controller.listMovements);
router.get('/adjustments', controller.listAdjustments);
router.get('/:productId', controller.getProductStock);

router.post('/adjust', authorize('Admin', 'InventoryManager'), validate(adjustStockSchema), controller.adjustStock);

export default router;
