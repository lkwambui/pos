import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './suppliers.controller';
import { createSupplierSchema, updateSupplierSchema } from './suppliers.validation';

const router = Router();
router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', authorize('Admin', 'InventoryManager'), validate(createSupplierSchema), controller.create);
router.put('/:id', authorize('Admin', 'InventoryManager'), validate(updateSupplierSchema), controller.update);
router.delete('/:id', authorize('Admin', 'InventoryManager'), controller.remove);

export default router;
