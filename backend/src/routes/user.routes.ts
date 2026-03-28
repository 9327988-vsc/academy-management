import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import * as userController from '../controllers/user.controller';

const router = Router();

router.use(authenticate);

router.get('/me', userController.getMe);

router.patch(
  '/me',
  [
    body('name').optional().isLength({ min: 1, max: 50 }).trim(),
    body('phone').optional().notEmpty().trim(),
  ],
  validate,
  userController.updateMe,
);

export default router;
