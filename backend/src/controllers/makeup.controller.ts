import { Response } from 'express';
import { AuthRequest } from '../types';
import * as makeupService from '../services/makeup.service';
import { handleError } from '../utils/error.utils';
import prisma from '../utils/prisma';

// ============================================
// 보강 슬롯
// ============================================

// 슬롯 생성
export async function createSlot(req: AuthRequest, res: Response) {
  try {
    const { userId, role } = req.user!;

    let teacherId: number;
    if (role === 'ADMIN' && req.body.teacherId) {
      teacherId = parseInt(req.body.teacherId);
    } else {
      const teacher = await prisma.teacher.findUnique({ where: { userId } });
      if (!teacher) {
        return res.status(404).json({ success: false, message: '강사 프로필을 찾을 수 없습니다.' });
      }
      teacherId = teacher.id;
    }

    const slot = await makeupService.createSlot(teacherId, req.body);

    res.status(201).json({ success: true, data: slot });
  } catch (error) {
    handleError(res, error);
  }
}

// 슬롯 목록 조회
export async function getSlots(req: AuthRequest, res: Response) {
  try {
    const { userId, role } = req.user!;
    const { startDate, endDate, classId, status, page, limit } = req.query;

    let teacherId: number | null = null;
    if (role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId } });
      if (!teacher) {
        return res.status(404).json({ success: false, message: '강사 프로필을 찾을 수 없습니다.' });
      }
      teacherId = teacher.id;
    }

    const result = await makeupService.getSlots(teacherId, {
      startDate: startDate as string,
      endDate: endDate as string,
      classId: classId ? parseInt(classId as string) : undefined,
      status: status as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    handleError(res, error);
  }
}

// 가용 슬롯 조회 (학생/학부모용)
export async function getAvailableSlots(req: AuthRequest, res: Response) {
  try {
    const { userId, role } = req.user!;
    const { studentId, classId, startDate, endDate } = req.query;

    let targetStudentId: number;

    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (!student) {
        return res.status(404).json({ success: false, message: '학생 프로필을 찾을 수 없습니다.' });
      }
      targetStudentId = student.id;
    } else if (role === 'PARENT') {
      const parent = await prisma.parent.findUnique({
        where: { userId },
        include: { students: { select: { id: true } } },
      });
      if (!parent) {
        return res.status(404).json({ success: false, message: '학부모 프로필을 찾을 수 없습니다.' });
      }
      targetStudentId = parseInt(studentId as string);
      if (!parent.students.some((s) => s.id === targetStudentId)) {
        return res.status(403).json({ success: false, message: '해당 학생의 정보를 조회할 권한이 없습니다.' });
      }
    } else {
      // TEACHER, ADMIN
      if (!studentId) {
        return res.status(400).json({ success: false, message: '학생 ID(studentId)가 필요합니다.' });
      }
      targetStudentId = parseInt(studentId as string);
      if (isNaN(targetStudentId)) {
        return res.status(400).json({ success: false, message: '학생 ID는 정수여야 합니다.' });
      }
    }

    const result = await makeupService.getAvailableSlots(targetStudentId, {
      classId: classId ? parseInt(classId as string) : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    handleError(res, error);
  }
}

// 슬롯 수정
export async function updateSlot(req: AuthRequest, res: Response) {
  try {
    const { userId, role } = req.user!;
    const slotId = parseInt(req.params.id);

    let teacherId: number | null = null;
    if (role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId } });
      if (!teacher) {
        return res.status(404).json({ success: false, message: '강사 프로필을 찾을 수 없습니다.' });
      }
      teacherId = teacher.id;
    }

    const slot = await makeupService.updateSlot(slotId, teacherId, req.body);

    res.json({ success: true, data: slot });
  } catch (error) {
    handleError(res, error);
  }
}

// 슬롯 삭제
export async function deleteSlot(req: AuthRequest, res: Response) {
  try {
    const { userId, role } = req.user!;
    const slotId = parseInt(req.params.id);

    let teacherId: number | null = null;
    if (role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId } });
      if (!teacher) {
        return res.status(404).json({ success: false, message: '강사 프로필을 찾을 수 없습니다.' });
      }
      teacherId = teacher.id;
    }

    await makeupService.deleteSlot(slotId, teacherId);

    res.json({ success: true, message: '보강 슬롯이 삭제되었습니다.' });
  } catch (error) {
    handleError(res, error);
  }
}

// ============================================
// 보강 신청
// ============================================

// 신청 생성
export async function createRequest(req: AuthRequest, res: Response) {
  try {
    const { userId, role } = req.user!;
    const { studentId, originalAttendanceId, slotId, studentNote } = req.body;

    // 학생 본인 확인
    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (!student || student.id !== parseInt(studentId)) {
        return res.status(403).json({ success: false, message: '해당 학생의 보강을 신청할 권한이 없습니다.' });
      }
    } else if (role === 'PARENT') {
      const parent = await prisma.parent.findUnique({
        where: { userId },
        include: { students: { select: { id: true } } },
      });
      if (!parent || !parent.students.some((s) => s.id === parseInt(studentId))) {
        return res.status(403).json({ success: false, message: '해당 학생의 보강을 신청할 권한이 없습니다.' });
      }
    }

    const result = await makeupService.createRequest({
      studentId: parseInt(studentId),
      originalAttendanceId: parseInt(originalAttendanceId),
      slotId: parseInt(slotId),
      studentNote,
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    handleError(res, error);
  }
}

// 신청 목록 조회
export async function getRequests(req: AuthRequest, res: Response) {
  try {
    const { userId, role } = req.user!;
    const { status, studentId, classId, startDate, endDate, page, limit } = req.query;

    const result = await makeupService.getRequests(userId, role, {
      status: status as string,
      studentId: studentId ? parseInt(studentId as string) : undefined,
      classId: classId ? parseInt(classId as string) : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    handleError(res, error);
  }
}

// 대기 중 신청 조회 (강사용)
export async function getPendingRequests(req: AuthRequest, res: Response) {
  try {
    const { userId, role } = req.user!;
    const { classId, page, limit } = req.query;

    let teacherId: number | null = null;
    if (role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId } });
      if (!teacher) {
        return res.status(404).json({ success: false, message: '강사 프로필을 찾을 수 없습니다.' });
      }
      teacherId = teacher.id;
    }

    const result = await makeupService.getPendingRequests(teacherId, {
      classId: classId ? parseInt(classId as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    handleError(res, error);
  }
}

// 신청 상태 변경
export async function updateRequestStatus(req: AuthRequest, res: Response) {
  try {
    const { userId, role } = req.user!;
    const requestId = parseInt(req.params.id);
    const { action, teacherNote } = req.body;

    const result = await makeupService.updateRequestStatus(
      requestId,
      userId,
      role,
      action,
      teacherNote
    );

    res.json({ success: true, data: result });
  } catch (error) {
    handleError(res, error);
  }
}
