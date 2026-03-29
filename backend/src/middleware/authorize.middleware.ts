import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: '접근 권한이 없습니다.' });
      return;
    }

    next();
  };
}
