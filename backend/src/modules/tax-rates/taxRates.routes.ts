import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './taxRates.controller';
import { createTaxRateSchema, updateTaxRateSchema } from './taxRates.validation';

const router = Router();
router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', authorize('Admin'), validate(createTaxRateSchema), controller.create);
router.put('/:id', authorize('Admin'), validate(updateTaxRateSchema), controller.update);
router.delete('/:id', authorize('Admin'), controller.remove);

export default router;
