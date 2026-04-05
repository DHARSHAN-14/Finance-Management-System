import { Router } from 'express';
import { chitController } from './chit.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createChitSchema, addMemberSchema, recordChitPaymentSchema, conductAuctionSchema } from './chit.schema';

const router = Router();
router.use(authenticate);

router.get('/', chitController.list);
router.get('/my', chitController.myChits);
router.get('/:id', chitController.findById);

router.post('/', authorize('ADMIN', 'STAFF'), validate(createChitSchema), chitController.create);
router.patch('/:id/activate', authorize('ADMIN'), chitController.activate);
router.patch('/:id/complete', authorize('ADMIN'), chitController.complete);

router.post('/:id/members', authorize('ADMIN', 'STAFF'), validate(addMemberSchema), chitController.addMember);
router.delete('/:id/members/:memberId', authorize('ADMIN'), chitController.removeMember);

router.post('/:id/installments/:installmentNo/payment', authorize('ADMIN', 'STAFF'), validate(recordChitPaymentSchema), chitController.recordPayment);
router.post('/:id/installments/:installmentNo/auction', authorize('ADMIN'), validate(conductAuctionSchema), chitController.conductAuction);

export default router;
