import { Router } from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import * as makeupController from '../controllers/makeup.controller';

const router = Router();

router.use(authenticate);

// ============================================
// 보강 슬롯
// ============================================

// 슬롯 생성
router.post(
  '/slots',
  authorize('TEACHER', 'ADMIN'),
  [
    body('slotDate').isISO8601().withMessage('올바른 날짜 형식이 아닙니다.'),
    body('startTime')
      .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
      .withMessage('시작 시간은 HH:mm 형식이어야 합니다.'),
    body('endTime')
      .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
      .withMessage('종료 시간은 HH:mm 형식이어야 합니다.'),
    body('maxStudents')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('최대 학생 수는 1~20 사이여야 합니다.'),
    body('classId').optional().isInt().withMessage('수업 ID는 정수여야 합니다.'),
    body('isRecurring').optional().isBoolean().withMessage('반복 여부는 boolean이어야 합니다.'),
    body('recurringDay')
      .optional()
      .isIn(['월', '화', '수', '목', '금', '토', '일'])
      .withMessage('요일은 월~일 중 하나여야 합니다.'),
  ],
  validate,
  makeupController.createSlot,
);

// 슬롯 목록 조회
router.get(
  '/slots',
  authorize('TEACHER', 'ADMIN'),
  [
    query('startDate').isISO8601().withMessage('시작일은 필수입니다.'),
    query('endDate').isISO8601().withMessage('종료일은 필수입니다.'),
    query('classId').optional().isInt().withMessage('수업 ID는 정수여야 합니다.'),
    query('status')
      .optional()
      .isIn(['AVAILABLE', 'FULL', 'CLOSED'])
      .withMessage('유효한 상태값이 아닙니다.'),
    query('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상이어야 합니다.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('페이지 크기는 1~100 사이여야 합니다.'),
  ],
  validate,
  makeupController.getSlots,
);

// 가용 슬롯 조회 (학생/학부모용)
router.get(
  '/slots/available',
  authorize('STUDENT', 'PARENT', 'TEACHER', 'ADMIN'),
  [
    query('studentId').optional().isInt().withMessage('학생 ID는 정수여야 합니다.'),
    query('classId').optional().isInt().withMessage('수업 ID는 정수여야 합니다.'),
    query('startDate').optional().isISO8601().withMessage('올바른 날짜 형식이 아닙니다.'),
    query('endDate').optional().isISO8601().withMessage('올바른 날짜 형식이 아닙니다.'),
  ],
  validate,
  makeupController.getAvailableSlots,
);

// 슬롯 수정
router.patch(
  '/slots/:id',
  authorize('TEACHER', 'ADMIN'),
  [
    body('slotDate').optional().isISO8601().withMessage('올바른 날짜 형식이 아닙니다.'),
    body('startTime')
      .optional()
      .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
      .withMessage('시작 시간은 HH:mm 형식이어야 합니다.'),
    body('endTime')
      .optional()
      .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
      .withMessage('종료 시간은 HH:mm 형식이어야 합니다.'),
    body('maxStudents')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('최대 학생 수는 1~20 사이여야 합니다.'),
    body('status')
      .optional()
      .isIn(['AVAILABLE', 'CLOSED'])
      .withMessage('상태는 AVAILABLE 또는 CLOSED만 설정 가능합니다.'),
  ],
  validate,
  makeupController.updateSlot,
);

// 슬롯 삭제
router.delete(
  '/slots/:id',
  authorize('TEACHER', 'ADMIN'),
  makeupController.deleteSlot,
);

// ============================================
// 보강 신청
// ============================================

// 신청 생성
router.post(
  '/requests',
  authorize('STUDENT', 'PARENT', 'TEACHER', 'ADMIN'),
  [
    body('studentId').notEmpty().isInt().withMessage('학생 ID가 필요합니다.'),
    body('originalAttendanceId').notEmpty().isInt().withMessage('출석 기록 ID가 필요합니다.'),
    body('slotId').notEmpty().isInt().withMessage('보강 슬롯 ID가 필요합니다.'),
    body('studentNote')
      .optional()
      .isLength({ max: 500 })
      .withMessage('메모는 500자 이내여야 합니다.')
      .trim(),
  ],
  validate,
  makeupController.createRequest,
);

// 신청 목록 조회
router.get(
  '/requests',
  [
    query('status')
      .optional()
      .isIn(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'])
      .withMessage('유효한 상태값이 아닙니다.'),
    query('studentId').optional().isInt().withMessage('학생 ID는 정수여야 합니다.'),
    query('classId').optional().isInt().withMessage('수업 ID는 정수여야 합니다.'),
    query('startDate').optional().isISO8601().withMessage('올바른 날짜 형식이 아닙니다.'),
    query('endDate').optional().isISO8601().withMessage('올바른 날짜 형식이 아닙니다.'),
    query('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상이어야 합니다.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('페이지 크기는 1~100 사이여야 합니다.'),
  ],
  validate,
  makeupController.getRequests,
);

// 대기 중 신청 조회 (강사용)
router.get(
  '/requests/pending',
  authorize('TEACHER', 'ADMIN'),
  [
    query('classId').optional().isInt().withMessage('수업 ID는 정수여야 합니다.'),
    query('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상이어야 합니다.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('페이지 크기는 1~100 사이여야 합니다.'),
  ],
  validate,
  makeupController.getPendingRequests,
);

// 신청 상태 변경
router.patch(
  '/requests/:id',
  authorize('TEACHER', 'ADMIN', 'STUDENT', 'PARENT'),
  [
    body('action')
      .isIn(['APPROVE', 'REJECT', 'COMPLETE', 'CANCEL'])
      .withMessage('유효한 액션이 아닙니다. (APPROVE, REJECT, COMPLETE, CANCEL)'),
    body('teacherNote')
      .optional()
      .isLength({ max: 500 })
      .withMessage('메모는 500자 이내여야 합니다.')
      .trim(),
  ],
  validate,
  makeupController.updateRequestStatus,
);

export default router;
