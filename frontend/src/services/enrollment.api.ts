import { apiClient } from './api.client';
import {
  Enrollment,
  EnrollmentWithDetails,
  PaginatedResponse,
} from '@/types/api.types';

export interface EnrollmentSearchParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 수강 신청 목록
export async function getEnrollmentsApi(params?: EnrollmentSearchParams) {
  const queryString = new URLSearchParams(
    Object.entries(params || {})
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  return await apiClient.get<PaginatedResponse<EnrollmentWithDetails>>(
    `/enrollments${queryString ? `?${queryString}` : ''}`
  );
}

// 수강 신청 생성
export async function createEnrollmentApi(data: {
  studentId: number;
  classId: number;
  tuitionFee: number;
  discount?: number;
  note?: string;
}) {
  return await apiClient.post<Enrollment>('/enrollments', data);
}

// 수강 신청 수정
export async function updateEnrollmentApi(id: number, data: Partial<Enrollment>) {
  return await apiClient.put<Enrollment>(`/enrollments/${id}`, data);
}

// 수강 신청 삭제
export async function deleteEnrollmentApi(id: number) {
  return await apiClient.delete(`/enrollments/${id}`);
}

// 학생별 수강 내역
export async function getStudentEnrollmentsApi(studentId: number) {
  return await apiClient.get<Enrollment[]>(`/enrollments/student/${studentId}`);
}

// 수업별 수강생
export async function getClassEnrollmentsApi(classId: number) {
  return await apiClient.get<Enrollment[]>(`/enrollments/class/${classId}`);
}
