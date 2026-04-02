import { Response } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function handleError(res: Response, error: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', error);
  } else {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
    });
  }

  const isDev = process.env.NODE_ENV === 'development';

  if (error instanceof Error) {
    return res.status(500).json({
      success: false,
      error: isDev ? error.message : '서버 내부 오류가 발생했습니다.',
    });
  }

  return res.status(500).json({
    success: false,
    error: '알 수 없는 오류가 발생했습니다.',
  });
}

export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
