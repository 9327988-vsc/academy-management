import client from './client';

export async function createSessionApi(params: {
  classId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  topic?: string;
  textbook?: string;
  pages?: string;
  keyConcepts?: string;
  homework?: string;
  homeworkDueDate?: string;
  nextTopic?: string;
  specialNotes?: string;
}) {
  const { data } = await client.post('/sessions', params);
  return data;
}

export async function getSessionByIdApi(id: string) {
  const { data } = await client.get(`/sessions/${id}`);
  return data;
}

export async function bulkAttendanceApi(params: {
  sessionId: string;
  attendance: { studentId: string; status: string; notes?: string }[];
}) {
  const { data } = await client.post('/attendance/bulk', params);
  return data;
}

export async function getSessionAttendanceApi(sessionId: string) {
  const { data } = await client.get(`/sessions/${sessionId}/attendance`);
  return data;
}

export async function previewNotificationApi(sessionId: string) {
  const { data } = await client.post(`/sessions/${sessionId}/preview-notification`);
  return data;
}

export async function sendNotificationApi(sessionId: string) {
  const { data } = await client.post(`/sessions/${sessionId}/send-notification`);
  return data;
}
