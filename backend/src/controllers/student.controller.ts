import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as studentService from '../services/student.service';

export async function createStudent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const student = await studentService.createStudent(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
}

export async function updateStudent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const student = await studentService.updateStudent(req.params.id, req.user!.userId, req.body);
    res.json({ success: true, data: student });
  } catch (err: any) {
    if (err.status) { res.status(err.status).json({ success: false, message: err.message }); return; }
    next(err);
  }
}

export async function deleteStudent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await studentService.deleteStudent(req.params.id, req.user!.userId);
    res.json({ success: true, message: '학생이 삭제되었습니다.' });
  } catch (err: any) {
    if (err.status) { res.status(err.status).json({ success: false, message: err.message }); return; }
    next(err);
  }
}

export async function addParent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parent = await studentService.addParent(req.params.id, req.user!.userId, req.body);
    res.status(201).json({ success: true, data: parent });
  } catch (err: any) {
    if (err.status) { res.status(err.status).json({ success: false, message: err.message }); return; }
    next(err);
  }
}

export async function deleteParent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await studentService.deleteParent(req.params.id, req.user!.userId);
    res.json({ success: true, message: '학부모 정보가 삭제되었습니다.' });
  } catch (err: any) {
    if (err.status) { res.status(err.status).json({ success: false, message: err.message }); return; }
    next(err);
  }
}
