import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import * as studentPortalController from '../controllers/studentPortal.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('student'));

router.get('/dashboard', studentPortalController.getDashboard);

export default router;
