import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import * as settingsController from '../controllers/settings.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', settingsController.getSettings);
router.put('/', settingsController.upsertSettings);

export default router;
