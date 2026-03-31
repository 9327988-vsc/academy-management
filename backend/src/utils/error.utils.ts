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
  console.error('❌ Error:', error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
    });
  }

  if (error instanceof Error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    error: '알 수 없는 오류가 발생했습니다',
  });
}

export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
