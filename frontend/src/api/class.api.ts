import client from './client';

export async function getClassesApi(date?: string) {
  const params = date ? { date } : {};
  const { data } = await client.get('/classes', { params });
  return data;
}

export async function getClassByIdApi(id: string) {
  const { data } = await client.get(`/classes/${id}`);
  return data;
}

export async function createClassApi(params: {
  name: string;
  subject: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
  maxStudents?: number;
}) {
  const { data } = await client.post('/classes', params);
  return data;
}

export async function updateClassApi(id: string, params: Record<string, unknown>) {
  const { data } = await client.patch(`/classes/${id}`, params);
  return data;
}

export async function deleteClassApi(id: string) {
  const { data } = await client.delete(`/classes/${id}`);
  return data;
}

export async function getClassStudentsApi(classId: string) {
  const { data } = await client.get(`/classes/${classId}/students`);
  return data;
}

export async function enrollStudentApi(classId: string, studentId: string) {
  const { data } = await client.post(`/classes/${classId}/enroll`, { studentId });
  return data;
}

export async function unenrollStudentApi(classId: string, studentId: string) {
  const { data } = await client.delete(`/classes/${classId}/students/${studentId}`);
  return data;
}

export async function getClassSessionsApi(classId: string, limit = 10, offset = 0) {
  const { data } = await client.get(`/classes/${classId}/sessions`, { params: { limit, offset } });
  return data;
}
