import { Router } from 'express';
import { customerController } from './customer.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createCustomerSchema, updateCustomerSchema } from './customer.schema';

const router = Router();

router.use(authenticate);

router.get('/', customerController.list);
router.get('/:id', customerController.findById);
router.get('/:id/stats', customerController.getStats);
router.post('/', authorize('ADMIN', 'STAFF'), validate(createCustomerSchema), customerController.create);
router.put('/:id', authorize('ADMIN', 'STAFF'), validate(updateCustomerSchema), customerController.update);
router.patch('/:id/deactivate', authorize('ADMIN'), customerController.deactivate);
router.patch('/:id/activate', authorize('ADMIN'), customerController.activate);
router.post('/:id/refresh-score', authorize('ADMIN', 'STAFF'), customerController.refreshHonestyScore);

export default router;
