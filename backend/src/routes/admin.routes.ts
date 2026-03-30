import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import * as adminController from '../controllers/admin.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('principal'));

router.get('/users', adminController.listUsers);

router.post('/users/create-with-data', adminController.createUserWithData);

router.patch(
  '/users/:id/role',
  [body('role').notEmpty().withMessage('역할을 지정해주세요.')],
  validate,
  adminController.updateUserRole,
);

router.delete('/users/:id', adminController.deleteUser);

router.get('/stats', adminController.getSystemStats);

// Dev Mode
router.get('/dev-mode/student-dashboard', adminController.getDevStudentDashboard);
router.get('/dev-mode/parent-children', adminController.getDevParentChildren);

export default router;
