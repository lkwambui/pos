import { Router } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './customers.controller';
import { createCustomerSchema, updateCustomerSchema } from './customers.validation';

const router = Router();
router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', requirePermission('manage', 'customers'), validate(createCustomerSchema), controller.create);
router.put('/:id', requirePermission('manage', 'customers'), validate(updateCustomerSchema), controller.update);
router.delete('/:id', requirePermission('manage', 'customers'), controller.remove);

export default router;
