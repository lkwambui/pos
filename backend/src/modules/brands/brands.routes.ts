import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './brands.controller';
import { createBrandSchema, updateBrandSchema } from './brands.validation';

const router = Router();
router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getById);

router.post('/', authorize('Admin'), validate(createBrandSchema), controller.create);
router.put('/:id', authorize('Admin'), validate(updateBrandSchema), controller.update);
router.delete('/:id', authorize('Admin'), controller.remove);

export default router;
