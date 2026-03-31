import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import * as paymentController from '../controllers/payment.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', paymentController.listPayments);
router.get('/stats', paymentController.getPaymentStats);

router.post(
  '/',
  [
    body('studentId').notEmpty().withMessage('학생을 선택해주세요.'),
    body('amount').isInt({ min: 0 }).withMessage('금액을 입력해주세요.'),
    body('month').notEmpty().withMessage('월을 입력해주세요.'),
  ],
  validate,
  paymentController.createPayment,
);

router.patch('/:id/status', paymentController.updatePaymentStatus);
router.delete('/:id', paymentController.deletePayment);

export default router;
