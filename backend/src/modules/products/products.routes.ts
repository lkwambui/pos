import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './products.controller';
import { createProductSchema, updateProductSchema } from './products.validation';

const router = Router();
router.use(authenticate);

router.get('/', controller.list);
router.get('/barcode/:barcode', controller.getByBarcode);
router.get('/:id', controller.getById);

router.post('/', authorize('Admin', 'InventoryManager'), validate(createProductSchema), controller.create);
router.put('/:id', authorize('Admin', 'InventoryManager'), validate(updateProductSchema), controller.update);
router.delete('/:id', authorize('Admin', 'InventoryManager'), controller.remove);

export default router;
