import client from './client';

export async function createStudentApi(params: {
  name: string;
  phone?: string;
  grade?: string;
  school?: string;
  parents?: { name: string; phone: string; relationship: string }[];
}) {
  const { data } = await client.post('/students', params);
  return data;
}

export async function updateStudentApi(id: string, params: Record<string, unknown>) {
  const { data } = await client.patch(`/students/${id}`, params);
  return data;
}

export async function deleteStudentApi(id: string) {
  const { data } = await client.delete(`/students/${id}`);
  return data;
}

export async function addParentApi(studentId: string, params: {
  name: string;
  phone: string;
  relationship: string;
}) {
  const { data } = await client.post(`/students/${studentId}/parents`, params);
  return data;
}

export async function deleteParentApi(parentId: string) {
  const { data } = await client.delete(`/parents/${parentId}`);
  return data;
}
