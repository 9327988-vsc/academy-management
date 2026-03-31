import { Response } from 'express';
import { AuthRequest } from '../types';
import * as teacherService from '../services/teacher.service';
import { handleError } from '../utils/error.utils';

// 강사 목록
export async function getTeachers(req: AuthRequest, res: Response) {
  try {
    const { page, pageSize, query, sortBy, sortOrder } = req.query;

    const result = await teacherService.getTeachers({
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

// 강사 상세
export async function getTeacherById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const teacher = await teacherService.getTeacherById(parseInt(id));

    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: '강사를 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    handleError(res, error);
  }
}

// 강사 생성
export async function createTeacher(req: AuthRequest, res: Response) {
  try {
    const teacher = await teacherService.createTeacher(req.body);

    res.status(201).json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    handleError(res, error);
  }
}

// 강사 수정
export async function updateTeacher(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const teacher = await teacherService.updateTeacher(parseInt(id), req.body);

    res.json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    handleError(res, error);
  }
}

// 강사 삭제
export async function deleteTeacher(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await teacherService.deleteTeacher(parseInt(id));

    res.json({
      success: true,
      message: '강사가 삭제되었습니다',
    });
  } catch (error) {
    handleError(res, error);
  }
}

// 강사별 학생 목록
export async function getTeacherStudents(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { page, pageSize, query } = req.query;

    const result = await teacherService.getTeacherStudents(parseInt(id), {
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      query: query as string,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error);
  }
}

// 강사 일정
export async function getTeacherSchedule(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { startDate, endDate, date, month } = req.query;

    const schedule = await teacherService.getTeacherSchedule(parseInt(id), {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      date: date ? new Date(date as string) : undefined,
      month: month as string,
    });

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    handleError(res, error);
  }
}

// 강사 급여 내역
export async function getTeacherSalaries(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { year } = req.query;

    const salaries = await teacherService.getTeacherSalaries(parseInt(id), {
      year: year ? parseInt(year as string) : undefined,
    });

    res.json({
      success: true,
      data: salaries,
    });
  } catch (error) {
    handleError(res, error);
  }
}
