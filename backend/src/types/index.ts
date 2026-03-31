import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
  params: Record<string, string>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: { field: string; message: string }[];
}
