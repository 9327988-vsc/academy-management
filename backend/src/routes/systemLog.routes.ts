import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import * as systemLogController from '../controllers/systemLog.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('principal'));

router.get('/', systemLogController.listLogs);

export default router;
