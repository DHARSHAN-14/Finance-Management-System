import { Router } from 'express';
import { paymentController } from './payment.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { recordPaymentSchema } from './payment.schema';

const router = Router();

router.use(authenticate);

router.get('/', paymentController.list);
router.get('/:id', paymentController.findById);
router.get('/customer/:customerId/summary', paymentController.getSummary);
router.post('/', authorize('ADMIN', 'STAFF'), validate(recordPaymentSchema), paymentController.record);

export default router;
