import { apiClient } from './api.client';
import type { LoginResponse, User } from '@/types/api.types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: 'TEACHER' | 'PARENT' | 'STUDENT';
  phone?: string;
}

// 로그인
export async function loginApi(data: LoginRequest) {
  const response = await apiClient.post<LoginResponse>('/auth/login', data);
  if (response.success && response.data?.token) {
    localStorage.setItem('accessToken', response.data.token);
  }
  return response;
}

// 회원가입
export async function registerApi(data: RegisterRequest) {
  const response = await apiClient.post<LoginResponse>('/auth/register', data);
  if (response.success && response.data?.token) {
    localStorage.setItem('accessToken', response.data.token);
  }
  return response;
}

// 로그아웃
export function logoutApi() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

// 현재 사용자 정보
export async function getMeApi() {
  return await apiClient.get<User>('/users/me');
}

// 비밀번호 변경
export async function changePasswordApi(data: {
  currentPassword: string;
  newPassword: string;
}) {
  return await apiClient.post('/auth/change-password', data);
}
