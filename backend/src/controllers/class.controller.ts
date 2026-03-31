import { Response } from 'express';
import { AuthRequest } from '../types';
import * as classService from '../services/class.service';
import * as enrollmentService from '../services/enrollment.service';
import { handleError } from '../utils/error.utils';

// 수업 목록
export async function getClasses(req: AuthRequest, res: Response) {
  try {
    const { page, pageSize, query, sortBy, sortOrder } = req.query;

    const result = await classService.getClasses({
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      query: query as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error);
  }
}

// 수업 상세
export async function getClassById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const cls = await classService.getClassById(parseInt(id));

    if (!cls) {
      return res.status(404).json({
        success: false,
        error: '수업을 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      data: cls,
    });
  } catch (error) {
    handleError(res, error);
  }
}

// 수업 생성
export async function createClass(req: AuthRequest, res: Response) {
  try {
    const cls = await classService.createClass(req.body);

    res.status(201).json({
      success: true,
      data: cls,
    });
  } catch (error) {
    handleError(res, error);
  }
}

// 수업 수정
export async function updateClass(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const cls = await classService.updateClass(parseInt(id), req.body);

    res.json({
      success: true,
      data: cls,
    });
  } catch (error) {
    handleError(res, error);
  }
}

// 수업 삭제
export async function deleteClass(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await classService.deleteClass(parseInt(id));

    res.json({
      success: true,
      message: '수업이 삭제되었습니다',
    });
  } catch (error) {
    handleError(res, error);
  }
}

// 수업별 학생 목록
export async function getClassStudents(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const students = await classService.getClassStudents(parseInt(id));

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    handleError(res, error);
  }
}

// 수업별 출석
export async function getClassAttendance(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { date } = req.query;

    const attendance = await classService.getClassAttendance(
      parseInt(id),
      date ? new Date(date as string) : new Date()
    );

    res.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    handleError(res, error);
  }
}

// 수강 등록
export async function enrollStudent(req: AuthRequest, res: Response) {
  try {
    const classId = parseInt(req.params.id);
    const cls = await classService.getClassById(classId);
    if (!cls) {
      return res.status(404).json({
        success: false,
        error: '수업을 찾을 수 없습니다',
      });
    }
    await enrollmentService.createEnrollment({
      studentId: parseInt(req.body.studentId),
      classId,
      tuitionFee: cls.tuitionFee,
    });
    res.status(201).json({ success: true, message: '학생이 수업에 등록되었습니다.' });
  } catch (error) {
    handleError(res, error);
  }
}

// 수강 해제
export async function unenrollStudent(req: AuthRequest, res: Response) {
  try {
    const enrollments = await enrollmentService.getClassEnrollments(parseInt(req.params.classId));
    const enrollment = enrollments.find(e => e.studentId === parseInt(req.params.studentId));
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: '수강 내역을 찾을 수 없습니다',
      });
    }
    await enrollmentService.deleteEnrollment(enrollment.id);
    res.json({ success: true, message: '학생이 수업에서 제거되었습니다.' });
  } catch (error) {
    handleError(res, error);
  }
}
