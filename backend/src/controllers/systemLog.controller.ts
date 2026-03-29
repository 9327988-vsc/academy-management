import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as systemLogService from '../services/systemLog.service';

export async function listLogs(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const result = await systemLogService.listLogs(limit, offset);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
