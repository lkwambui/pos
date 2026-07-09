import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './purchases.controller';
import { createPurchaseSchema, updatePurchaseSchema } from './purchases.validation';

const router = Router();
router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', authorize('Admin', 'InventoryManager', 'Manager'), validate(createPurchaseSchema), controller.create);
router.put('/:id', authorize('Admin', 'InventoryManager', 'Manager'), validate(updatePurchaseSchema), controller.update);
router.post('/:id/receive', authorize('Admin', 'InventoryManager', 'Manager'), controller.receive);
router.post('/:id/cancel', authorize('Admin', 'InventoryManager', 'Manager'), controller.cancel);

export default router;
