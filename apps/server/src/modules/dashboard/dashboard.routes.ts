import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/summary', dashboardController.summary);
router.get('/activity', authorize('ADMIN', 'STAFF'), dashboardController.activity);
router.get('/monthly-chart', authorize('ADMIN', 'STAFF'), dashboardController.monthlyChart);

export default router;
