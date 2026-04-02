import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as adminService from '../services/admin.service';

export async function createUserWithData(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { email, password, name, phone, role, grade, school, parentPhone } = req.body;

    if (!email || !password || !name || !phone || !role) {
      res.status(400).json({ success: false, message: '필수 항목을 모두 입력해주세요.' });
      return;
    }

    if (!['TEACHER', 'ADMIN', 'PARENT', 'STUDENT'].includes(role)) {
      res.status(400).json({ success: false, message: '유효하지 않은 역할입니다.' });
      return;
    }

    const result = await adminService.createUserWithData({
      email, password, name, phone, role, grade, school, parentPhone,
    });

    res.json({ success: true, data: result, message: result.warning || '사용자가 생성되었습니다.' });
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ success: false, message: '이미 등록된 이메일입니다.' });
      return;
    }
    next(err);
  }
}

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
    const id = parseInt(req.params.id);
    const { role } = req.body;

    if (!['TEACHER', 'ADMIN', 'PARENT', 'STUDENT'].includes(role)) {
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
    const id = parseInt(req.params.id);

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

// --- Dev Mode ---

export async function getDevStudentDashboard(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await adminService.getDevStudentDashboard();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getDevParentChildren(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const children = await adminService.getDevParentChildren();
    res.json({ success: true, data: { children } });
  } catch (err) {
    next(err);
  }
}
