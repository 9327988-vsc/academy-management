import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as dashboardService from '../services/dashboard.service';

export async function getStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const stats = await dashboardService.getStats(req.user!.userId);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}
