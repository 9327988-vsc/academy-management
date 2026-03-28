import client from './client';

export async function getDashboardStatsApi() {
  const { data } = await client.get('/dashboard/stats');
  return data;
}
