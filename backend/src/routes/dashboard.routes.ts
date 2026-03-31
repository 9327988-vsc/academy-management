import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('TEACHER', 'ADMIN'));

router.get('/stats', dashboardController.getStats);

export default router;
