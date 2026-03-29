import client from './client';

export async function getStudentDashboardApi() {
  const { data } = await client.get('/student-portal/dashboard');
  return data;
}
