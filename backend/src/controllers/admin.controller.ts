import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as adminService from '../services/admin.service';

export async function listUsers(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const users = await adminService.listUsers();
    res.json({ success: true, data: { users } });
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['teacher', 'principal', 'parent', 'student'].includes(role)) {
      res.status(400).json({ success: false, message: '유효하지 않은 역할입니다.' });
      return;
    }

    const user = await adminService.updateUserRole(id, role);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    if (id === req.user!.userId) {
      res.status(400).json({ success: false, message: '자신의 계정은 삭제할 수 없습니다.' });
      return;
    }

    await adminService.deleteUser(id);
    res.json({ success: true, message: '사용자가 삭제되었습니다.' });
  } catch (err) {
    next(err);
  }
}

export async function getSystemStats(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const stats = await adminService.getSystemStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}
