import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import * as attendanceController from '../controllers/attendance.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('teacher', 'principal'));

router.post(
  '/bulk',
  [
    body('sessionId').notEmpty().withMessage('세션 ID가 필요합니다.'),
    body('attendance').isArray({ min: 1 }).withMessage('출석 데이터가 필요합니다.'),
    body('attendance.*.studentId').notEmpty().withMessage('학생 ID가 필요합니다.'),
    body('attendance.*.status').isIn(['present', 'absent', 'late']).withMessage('올바른 출석 상태를 입력해주세요.'),
  ],
  validate,
  attendanceController.bulkCreate,
);

router.patch(
  '/:id',
  [body('status').isIn(['present', 'absent', 'late']).withMessage('올바른 출석 상태를 입력해주세요.')],
  validate,
  attendanceController.updateAttendance,
);

export default router;
