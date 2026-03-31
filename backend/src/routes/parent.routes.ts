import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import * as parentController from '../controllers/parent.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('PARENT'));

router.get('/children', parentController.getChildren);

export default router;
