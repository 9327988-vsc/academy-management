import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import * as sessionController from '../controllers/session.controller';
import * as attendanceController from '../controllers/attendance.controller';
import * as notificationController from '../controllers/notification.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('teacher', 'principal'));

router.post(
  '/',
  [
    body('classId').notEmpty().withMessage('수업 ID가 필요합니다.'),
    body('sessionDate').notEmpty().withMessage('수업 날짜를 입력해주세요.'),
    body('startTime').notEmpty().withMessage('시작 시간을 입력해주세요.'),
    body('endTime').notEmpty().withMessage('종료 시간을 입력해주세요.'),
  ],
  validate,
  sessionController.createSession,
);

router.get('/:id', sessionController.getSessionById);

// 세션별 출석 현황
router.get('/:id/attendance', attendanceController.getClassAttendance);

// 세션별 알림
router.post('/:id/preview-notification', notificationController.previewNotification);
router.post('/:id/send-notification', notificationController.sendNotification);

export default router;
