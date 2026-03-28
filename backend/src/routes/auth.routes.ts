import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('올바른 이메일을 입력해주세요.').trim(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('비밀번호는 8자 이상이어야 합니다.')
      .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
      .withMessage('비밀번호는 영문과 숫자를 포함해야 합니다.'),
    body('name').isLength({ min: 1, max: 50 }).withMessage('이름을 입력해주세요.').trim(),
    body('phone').notEmpty().withMessage('전화번호를 입력해주세요.').trim(),
  ],
  validate,
  authController.register,
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('올바른 이메일을 입력해주세요.').trim(),
    body('password').notEmpty().withMessage('비밀번호를 입력해주세요.'),
  ],
  validate,
  authController.login,
);

router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('리프레시 토큰이 필요합니다.')],
  validate,
  authController.refresh,
);

router.post('/logout', authenticate, authController.logout);

export default router;
