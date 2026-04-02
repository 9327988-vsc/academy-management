import { apiClient } from './api.client';
import type {
  Teacher,
  TeacherWithDetails,
  PaginatedResponse,
  TeacherSchedule,
  SalaryRecord,
} from '@/types/api.types';

export interface TeacherSearchParams {
  page?: number;
  pageSize?: number;
  query?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 강사 목록
export async function getTeachersApi(params?: TeacherSearchParams) {
  const queryString = new URLSearchParams(
    Object.entries(params || {})
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  return await apiClient.get<PaginatedResponse<Teacher>>(
    `/teachers${queryString ? `?${queryString}` : ''}`
  );
}

// 강사 상세
export async function getTeacherByIdApi(id: number) {
  return await apiClient.get<TeacherWithDetails>(`/teachers/${id}`);
}

// 강사 생성
export async function createTeacherApi(data: Partial<Teacher>) {
  return await apiClient.post<Teacher>('/teachers', data);
}

// 강사 수정
export async function updateTeacherApi(id: number, data: Partial<Teacher>) {
  return await apiClient.put<Teacher>(`/teachers/${id}`, data);
}

// 강사 삭제
export async function deleteTeacherApi(id: number) {
  return await apiClient.delete(`/teachers/${id}`);
}

// 강사별 학생 목록
export async function getTeacherStudentsApi(id: number, params?: TeacherSearchParams) {
  const queryString = new URLSearchParams(
    Object.entries(params || {})
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  return await apiClient.get(
    `/teachers/${id}/students${queryString ? `?${queryString}` : ''}`
  );
}

// 강사 일정
export async function getTeacherScheduleApi(
  id: number,
  params?: {
    startDate?: string;
    endDate?: string;
    date?: string;
    month?: string;
  }
) {
  const queryString = new URLSearchParams(
    Object.entries(params || {})
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  return await apiClient.get<TeacherSchedule[]>(
    `/teachers/${id}/schedule${queryString ? `?${queryString}` : ''}`
  );
}

// 강사 급여 내역
export async function getTeacherSalariesApi(id: number, params?: { year?: number }) {
  const queryString = params?.year ? `?year=${params.year}` : '';
  return await apiClient.get<SalaryRecord[]>(`/teachers/${id}/salaries${queryString}`);
}
