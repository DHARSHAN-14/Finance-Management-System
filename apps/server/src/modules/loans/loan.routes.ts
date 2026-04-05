import { Router } from 'express';
import { loanController } from './loan.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createLoanSchema, disburseLoanSchema } from './loan.schema';

const router = Router();

router.use(authenticate);

router.get('/', loanController.list);
router.get('/overdue', authorize('ADMIN', 'STAFF'), loanController.getOverdue);
router.get('/emi-preview', loanController.emiPreview);
router.get('/:id', loanController.findById);
router.get('/:id/schedule', loanController.getSchedule);

router.post('/', authorize('ADMIN', 'STAFF'), validate(createLoanSchema), loanController.create);
router.patch('/:id/approve', authorize('ADMIN'), loanController.approve);
router.patch('/:id/reject', authorize('ADMIN'), loanController.reject);
router.patch('/:id/disburse', authorize('ADMIN'), validate(disburseLoanSchema), loanController.disburse);
router.patch('/:id/close', authorize('ADMIN'), loanController.close);
router.post('/mark-overdue', authorize('ADMIN'), loanController.markOverdue);

export default router;
