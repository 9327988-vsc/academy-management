import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import * as classController from '../controllers/class.controller';
import * as sessionController from '../controllers/session.controller';

const router = Router();

router.use(authenticate);

router.get('/', classController.getClasses);
router.get('/:id', classController.getClassById);

router.post(
  '/',
  [
    body('name').isLength({ min: 1, max: 100 }).withMessage('수업명을 입력해주세요.').trim(),
    body('subject').isLength({ min: 1, max: 50 }).withMessage('과목을 입력해주세요.').trim(),
    body('dayOfWeek').notEmpty().withMessage('수업 요일을 입력해주세요.'),
    body('startTime').notEmpty().withMessage('시작 시간을 입력해주세요.'),
    body('endTime').notEmpty().withMessage('종료 시간을 입력해주세요.'),
  ],
  validate,
  classController.createClass,
);

router.patch(
  '/:id',
  [
    body('name').optional().isLength({ min: 1, max: 100 }).trim(),
    body('subject').optional().isLength({ min: 1, max: 50 }).trim(),
    body('maxStudents').optional().isInt({ min: 1 }),
  ],
  validate,
  classController.updateClass,
);
router.delete('/:id', classController.deleteClass);

// 수업-학생 연결
router.get('/:id/students', classController.getClassStudents);

router.post(
  '/:id/enroll',
  [body('studentId').notEmpty().withMessage('학생 ID가 필요합니다.')],
  validate,
  classController.enrollStudent,
);

router.delete('/:classId/students/:studentId', classController.unenrollStudent);

// 수업별 세션 목록
router.get('/:id/sessions', sessionController.getClassSessions);

export default router;
