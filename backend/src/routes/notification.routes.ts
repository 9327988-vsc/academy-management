import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import * as notificationController from '../controllers/notification.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('teacher', 'principal'));

router.get('/', notificationController.getNotifications);

export default router;
