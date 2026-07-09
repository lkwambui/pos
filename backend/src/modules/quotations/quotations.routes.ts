import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './quotations.controller';
import { createQuotationSchema, updateQuotationSchema } from './quotations.validation';

const router = Router();
router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', validate(createQuotationSchema), controller.create);
router.put('/:id', validate(updateQuotationSchema), controller.update);
router.delete('/:id', controller.remove);
router.post('/:id/convert', controller.convertToSale);

export default router;
