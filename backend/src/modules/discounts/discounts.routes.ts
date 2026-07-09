import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './discounts.controller';
import { createDiscountSchema, updateDiscountSchema } from './discounts.validation';

const router = Router();
router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', authorize('Admin'), validate(createDiscountSchema), controller.create);
router.put('/:id', authorize('Admin'), validate(updateDiscountSchema), controller.update);
router.delete('/:id', authorize('Admin'), controller.remove);

export default router;
