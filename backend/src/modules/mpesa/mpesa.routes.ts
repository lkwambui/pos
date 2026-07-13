import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './mpesa.controller';
import { stkPushSchema, queryStatusSchema } from './mpesa.validation';

const router = Router();

router.post('/stk-push', authenticate, validate(stkPushSchema), controller.initiateStkPush);
router.get('/status/:checkoutRequestId', authenticate, controller.queryPaymentStatus);
router.post('/callback', controller.mpesaCallback);

export default router;
