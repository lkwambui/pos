import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './payments.controller';
import { createPaymentSchema, refundPaymentSchema } from './payments.validation';

const router = Router();
router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', validate(createPaymentSchema), controller.create);
router.post('/:id/refund', validate(refundPaymentSchema), controller.refund);

export default router;
