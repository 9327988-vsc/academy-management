import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as attendanceService from '../services/attendance.service';

export async function bulkCreate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await attendanceService.bulkCreate(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    if (err.status) { res.status(err.status).json({ success: false, message: err.message }); return; }
    next(err);
  }
}

export async function updateAttendance(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await attendanceService.updateAttendance(req.params.id, req.user!.userId, req.body);
    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err.status) { res.status(err.status).json({ success: false, message: err.message }); return; }
    next(err);
  }
}

export async function getSessionAttendance(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await attendanceService.getSessionAttendance(req.params.id, req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err.status) { res.status(err.status).json({ success: false, message: err.message }); return; }
    next(err);
  }
}
