import { apiClient } from './api.client';
import type {
  Student,
  StudentWithDetails,
  PaginatedResponse,
  AttendanceStats,
  PaymentStats,
  Grade,
} from '@/types/api.types';

export interface StudentSearchParams {
  page?: number;
  pageSize?: number;
  query?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 학생 목록
export async function getStudentsApi(params?: StudentSearchParams) {
  const queryString = new URLSearchParams(
    Object.entries(params || {})
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  return await apiClient.get<PaginatedResponse<Student>>(
    `/students${queryString ? `?${queryString}` : ''}`
  );
}

// 학생 상세
export async function getStudentByIdApi(id: number) {
  return await apiClient.get<StudentWithDetails>(`/students/${id}`);
}

// 학생 생성
export async function createStudentApi(data: Partial<Student>) {
  return await apiClient.post<Student>('/students', data);
}

// 학생 수정
export async function updateStudentApi(id: number, data: Partial<Student>) {
  return await apiClient.put<Student>(`/students/${id}`, data);
}

// 학생 삭제
export async function deleteStudentApi(id: number) {
  return await apiClient.delete(`/students/${id}`);
}

// 학생 출석 통계
export async function getStudentAttendanceStatsApi(
  id: number,
  params?: {
    startDate?: string;
    endDate?: string;
    month?: string;
  }
) {
  const queryString = new URLSearchParams(
    Object.entries(params || {})
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  return await apiClient.get<AttendanceStats>(
    `/students/${id}/attendance-stats${queryString ? `?${queryString}` : ''}`
  );
}

// 학생 결제 통계
export async function getStudentPaymentStatsApi(
  id: number,
  params?: {
    startDate?: string;
    endDate?: string;
    month?: string;
  }
) {
  const queryString = new URLSearchParams(
    Object.entries(params || {})
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  return await apiClient.get<PaymentStats>(
    `/students/${id}/payment-stats${queryString ? `?${queryString}` : ''}`
  );
}

// 학생 성적
export async function getStudentGradesApi(id: number, params?: { subject?: string }) {
  const queryString = params?.subject ? `?subject=${params.subject}` : '';
  return await apiClient.get<Grade[]>(`/students/${id}/grades${queryString}`);
}
