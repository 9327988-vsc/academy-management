import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as sessionService from '../services/session.service';

export async function createSession(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const session = await sessionService.createSession(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: session });
  } catch (err: any) {
    if (err.status) { res.status(err.status).json({ success: false, message: err.message }); return; }
    next(err);
  }
}

export async function getSessionById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const session = await sessionService.getSessionById(req.params.id, req.user!.userId);
    res.json({ success: true, data: session });
  } catch (err: any) {
    if (err.status) { res.status(err.status).json({ success: false, message: err.message }); return; }
    next(err);
  }
}

export async function getClassSessions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const result = await sessionService.getClassSessions(req.params.id, req.user!.userId, limit, offset);
    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err.status) { res.status(err.status).json({ success: false, message: err.message }); return; }
    next(err);
  }
}
