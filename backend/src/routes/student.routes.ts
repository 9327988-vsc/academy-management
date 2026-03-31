import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import * as studentController from '../controllers/student.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('TEACHER', 'ADMIN'));

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

// addParent는 v2에서 Student.parentId로 직접 연결
// 별도 API는 향후 추가 예정

export default router;
