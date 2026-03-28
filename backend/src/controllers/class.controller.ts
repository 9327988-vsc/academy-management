import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as classService from '../services/class.service';

export async function getClasses(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const date = req.query.date as string | undefined;
    const classes = await classService.getClasses(req.user!.userId, date);
    res.json({ success: true, data: { classes } });
  } catch (err) {
    next(err);
  }
}

export async function getClassById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await classService.getClassById(req.params.id, req.user!.userId);
    res.json({ success: true, data });
  } catch (err: any) {
    if (err.status) { res.status(err.status).json({ success: false, message: err.message }); return; }
    next(err);
  }
}

export async function createClass(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const cls = await classService.createClass(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: cls });
  } catch (err) {
    next(err);
  }
}

export async function updateClass(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const cls = await classService.updateClass(req.params.id, req.user!.userId, req.body);
    res.json({ success: true, data: cls });
  } catch (err: any) {
    if (err.status) { res.status(err.status).json({ success: false, message: err.message }); return; }
    next(err);
  }
}

export async function deleteClass(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await classService.deleteClass(req.params.id, req.user!.userId);
    res.json({ success: true, message: '수업이 삭제되었습니다.' });
  } catch (err: any) {
    if (err.status) { res.status(err.status).json({ success: false, message: err.message }); return; }
    next(err);
  }
}

export async function getClassStudents(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const students = await classService.getClassStudents(req.params.id, req.user!.userId);
    res.json({ success: true, data: { students } });
  } catch (err: any) {
    if (err.status) { res.status(err.status).json({ success: false, message: err.message }); return; }
    next(err);
  }
}

export async function enrollStudent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await classService.enrollStudent(req.params.id, req.body.studentId, req.user!.userId);
    res.status(201).json({ success: true, message: '학생이 수업에 등록되었습니다.' });
  } catch (err: any) {
    if (err.status) { res.status(err.status).json({ success: false, message: err.message }); return; }
    next(err);
  }
}

export async function unenrollStudent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await classService.unenrollStudent(req.params.classId, req.params.studentId, req.user!.userId);
    res.json({ success: true, message: '학생이 수업에서 제거되었습니다.' });
  } catch (err: any) {
    if (err.status) { res.status(err.status).json({ success: false, message: err.message }); return; }
    next(err);
  }
}
