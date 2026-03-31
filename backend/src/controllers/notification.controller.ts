import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as notificationService from '../services/notification.service';

export async function previewNotification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await notificationService.previewNotification(parseInt(req.params.id), req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err.status) { res.status(err.status).json({ success: false, message: err.message }); return; }
    next(err);
  }
}

export async function sendNotification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await notificationService.sendNotification(parseInt(req.params.id), req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err.status) { res.status(err.status).json({ success: false, message: err.message }); return; }
    next(err);
  }
}

export async function getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await notificationService.getNotifications({
      teacherId: req.user!.userId,
      classId: req.query.classId ? parseInt(req.query.classId as string) : undefined,
      status: req.query.status as string,
      limit: parseInt(req.query.limit as string) || 20,
      offset: parseInt(req.query.offset as string) || 0,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
