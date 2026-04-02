import client from './client';

export async function createSlotApi(params: {
  classId?: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  maxStudents?: number;
  isRecurring?: boolean;
  recurringDay?: string;
}) {
  const { data } = await client.post('/makeup/slots', params);
  return data;
}

export async function getSlotsApi(params?: {
  startDate?: string;
  endDate?: string;
  classId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { data } = await client.get('/makeup/slots', { params });
  return data;
}

export async function getAvailableSlotsApi(params?: {
  studentId?: string;
  classId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { data } = await client.get('/makeup/slots/available', { params });
  return data;
}

export async function updateSlotApi(id: string, params: Record<string, unknown>) {
  const { data } = await client.patch(`/makeup/slots/${id}`, params);
  return data;
}

export async function deleteSlotApi(id: string) {
  const { data } = await client.delete(`/makeup/slots/${id}`);
  return data;
}

export async function createRequestApi(params: {
  studentId: string;
  originalAttendanceId: string;
  slotId: string;
  studentNote?: string;
}) {
  const { data } = await client.post('/makeup/requests', params);
  return data;
}

export async function getRequestsApi(params?: {
  status?: string;
  studentId?: string;
  classId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const { data } = await client.get('/makeup/requests', { params });
  return data;
}

export async function getPendingRequestsApi(params?: {
  classId?: string;
  page?: number;
  limit?: number;
}) {
  const { data } = await client.get('/makeup/requests/pending', { params });
  return data;
}

export async function updateRequestStatusApi(id: string, params: {
  action: 'APPROVE' | 'REJECT' | 'COMPLETE' | 'CANCEL';
  teacherNote?: string;
}) {
  const { data } = await client.patch(`/makeup/requests/${id}`, params);
  return data;
}
