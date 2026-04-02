import { Response } from 'express';
import { AuthRequest } from '../types';
import * as studentService from '../services/student.service';
import { handleError } from '../utils/error.utils';

// 학생 목록
export async function getStudents(req: AuthRequest, res: Response) {
  try {
    const { page, pageSize, query, sortBy, sortOrder } = req.query;

    const result = await studentService.getStudents({
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

// 학생 상세
export async function getStudentById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const student = await studentService.getStudentById(parseInt(id));

    if (!student) {
      return res.status(404).json({
        success: false,
        error: '학생을 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    handleError(res, error);
  }
}

// 학생 생성
export async function createStudent(req: AuthRequest, res: Response) {
  try {
    const student = await studentService.createStudent(req.body);

    res.status(201).json({
      success: true,
      data: student,
    });
  } catch (error) {
    handleError(res, error);
  }
}

// 학생 수정
export async function updateStudent(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const student = await studentService.updateStudent(parseInt(id), req.body);

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    handleError(res, error);
  }
}

// 학생 삭제
export async function deleteStudent(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await studentService.deleteStudent(parseInt(id));

    res.json({
      success: true,
      message: '학생이 삭제되었습니다',
    });
  } catch (error) {
    handleError(res, error);
  }
}

// 학생 출석 통계
export async function getStudentAttendanceStats(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { startDate, endDate, month } = req.query;

    const stats = await studentService.getStudentAttendanceStats(parseInt(id), {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      month: month as string,
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    handleError(res, error);
  }
}

// 학생 결제 통계
export async function getStudentPaymentStats(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { startDate, endDate, month } = req.query;

    const stats = await studentService.getStudentPaymentStats(parseInt(id), {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      month: month as string,
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    handleError(res, error);
  }
}

// 학생 성적
export async function getStudentGrades(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { subject } = req.query;

    const grades = await studentService.getStudentGrades(parseInt(id), {
      subject: subject as string,
    });

    res.json({
      success: true,
      data: grades,
    });
  } catch (error) {
    handleError(res, error);
  }
}

// 학부모 연결 해제 (하위 호환)
export async function deleteParent(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await studentService.updateStudent(parseInt(id), { parentId: undefined } as any);

    res.json({
      success: true,
      message: '학부모 연결이 해제되었습니다',
    });
  } catch (error) {
    handleError(res, error);
  }
}
