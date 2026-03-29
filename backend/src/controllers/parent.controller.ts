import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as parentService from '../services/parent.service';
import prisma from '../utils/prisma';

export async function getChildren(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
      return;
    }

    const children = await parentService.getChildrenByParentPhone(user.phone);
    res.json({ success: true, data: { children } });
  } catch (err) {
    next(err);
  }
}
