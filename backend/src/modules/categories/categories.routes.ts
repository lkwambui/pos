import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './categories.controller';
import { createCategorySchema, updateCategorySchema } from './categories.validation';

const router = Router();
router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getById);

router.post('/', authorize('Admin'), validate(createCategorySchema), controller.create);
router.put('/:id', authorize('Admin'), validate(updateCategorySchema), controller.update);
router.delete('/:id', authorize('Admin'), controller.remove);

export default router;
