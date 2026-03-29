import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as studentPortalService from '../services/studentPortal.service';
import prisma from '../utils/prisma';

export async function getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
      return;
    }

    const data = await studentPortalService.getStudentDashboard(user.phone);
    if (!data) {
      res.json({ success: true, data: null, message: '연결된 학생 정보가 없습니다.' });
      return;
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
