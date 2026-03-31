import client from './client';

// Users
export async function getAdminUsersApi() {
  const { data } = await client.get('/admin/users');
  return data;
}

export async function updateUserRoleApi(userId: number, role: string) {
  const { data } = await client.patch(`/admin/users/${userId}/role`, { role });
  return data;
}

export async function createUserWithDataApi(body: {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: string;
  grade?: string;
  school?: string;
  parentPhone?: string;
}) {
  const { data } = await client.post('/admin/users/create-with-data', body);
  return data;
}

export async function deleteUserApi(userId: number) {
  const { data } = await client.delete(`/admin/users/${userId}`);
  return data;
}

export async function getAdminStatsApi() {
  const { data } = await client.get('/admin/stats');
  return data;
}

// Settings
export async function getSettingsApi() {
  const { data } = await client.get('/admin/settings');
  return data;
}

export async function updateSettingsApi(settings: {
  academyName?: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  businessNumber?: string;
}) {
  const { data } = await client.put('/admin/settings', settings);
  return data;
}

// Announcements
export async function getAnnouncementsApi() {
  const { data } = await client.get('/admin/announcements');
  return data;
}

export async function createAnnouncementApi(body: { title: string; content: string; important?: boolean }) {
  const { data } = await client.post('/admin/announcements', body);
  return data;
}

export async function updateAnnouncementApi(id: number, body: { title?: string; content?: string; important?: boolean }) {
  const { data } = await client.patch(`/admin/announcements/${id}`, body);
  return data;
}

export async function deleteAnnouncementApi(id: number) {
  const { data } = await client.delete(`/admin/announcements/${id}`);
  return data;
}

// System Logs
export async function getSystemLogsApi(limit = 100, offset = 0) {
  const { data } = await client.get(`/admin/logs?limit=${limit}&offset=${offset}`);
  return data;
}

// Payments
export async function getPaymentsApi(filters?: { status?: string; month?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.month) params.set('month', filters.month);
  const { data } = await client.get(`/admin/payments?${params}`);
  return data;
}

export async function createPaymentApi(body: { studentId: number; amount: number; month: string; description?: string }) {
  const { data } = await client.post('/admin/payments', body);
  return data;
}

export async function updatePaymentStatusApi(id: number, status: string) {
  const { data } = await client.patch(`/admin/payments/${id}/status`, { status });
  return data;
}

export async function deletePaymentApi(id: number) {
  const { data } = await client.delete(`/admin/payments/${id}`);
  return data;
}

export async function getPaymentStatsApi() {
  const { data } = await client.get('/admin/payments/stats');
  return data;
}

// Dev Mode
export async function getDevStudentDashboardApi() {
  const { data } = await client.get('/admin/dev-mode/student-dashboard');
  return data;
}

export async function getDevParentChildrenApi() {
  const { data } = await client.get('/admin/dev-mode/parent-children');
  return data;
}
