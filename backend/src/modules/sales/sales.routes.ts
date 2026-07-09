import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { requirePermission } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './sales.controller';
import { createSaleSchema, updateSaleStatusSchema } from './sales.validation';

const router = Router();
router.use(authenticate);

router.get('/', controller.list);
router.get('/number/:saleNumber', controller.getByNumber);
router.get('/:id', controller.getById);
router.post('/', requirePermission('create', 'sales'), validate(createSaleSchema), controller.create);
router.put('/:id', validate(updateSaleStatusSchema), controller.update);
router.post('/:id/cancel', authorize('Admin', 'Manager'), controller.cancel);

export default router;
