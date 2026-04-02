import { apiClient } from './api.client';
import type {
  Class,
  ClassWithDetails,
  PaginatedResponse,
  Student,
  Attendance,
} from '@/types/api.types';

export interface ClassSearchParams {
  page?: number;
  pageSize?: number;
  query?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 수업 목록
export async function getClassesApi(params?: ClassSearchParams) {
  const queryString = new URLSearchParams(
    Object.entries(params || {})
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  return await apiClient.get<PaginatedResponse<Class>>(
    `/classes${queryString ? `?${queryString}` : ''}`
  );
}

// 수업 상세
export async function getClassByIdApi(id: number) {
  return await apiClient.get<ClassWithDetails>(`/classes/${id}`);
}

// 수업 생성
export async function createClassApi(data: Partial<Class>) {
  return await apiClient.post<Class>('/classes', data);
}

// 수업 수정
export async function updateClassApi(id: number, data: Partial<Class>) {
  return await apiClient.put<Class>(`/classes/${id}`, data);
}

// 수업 삭제
export async function deleteClassApi(id: number) {
  return await apiClient.delete(`/classes/${id}`);
}

// 수업별 학생 목록
export async function getClassStudentsApi(id: number) {
  return await apiClient.get<Student[]>(`/classes/${id}/students`);
}

// 수업별 출석 현황
export async function getClassAttendanceApi(id: number, date?: string) {
  const queryString = date ? `?date=${date}` : '';
  return await apiClient.get<Attendance[]>(`/classes/${id}/attendance${queryString}`);
}
