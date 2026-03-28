import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import * as studentController from '../controllers/student.controller';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('name').isLength({ min: 1, max: 50 }).withMessage('이름을 입력해주세요.').trim(),
    body('parents').optional().isArray(),
  ],
  validate,
  studentController.createStudent,
);

router.patch(
  '/:id',
  [
    body('name').optional().isLength({ min: 1, max: 50 }).trim(),
    body('phone').optional().trim(),
    body('grade').optional().trim(),
    body('school').optional().trim(),
  ],
  validate,
  studentController.updateStudent,
);
router.delete('/:id', studentController.deleteStudent);

router.post(
  '/:id/parents',
  [
    body('name').isLength({ min: 1, max: 50 }).withMessage('이름을 입력해주세요.').trim(),
    body('phone').notEmpty().withMessage('전화번호를 입력해주세요.').trim(),
    body('relationship').notEmpty().withMessage('관계를 입력해주세요.'),
  ],
  validate,
  studentController.addParent,
);

export default router;
