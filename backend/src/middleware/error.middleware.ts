import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.error('[ERROR]', err.message);
  }

  res.status(500).json({
    success: false,
    message: '서버 내부 오류가 발생했습니다.',
    ...(isDev && { detail: err.message }),
  });
}
