import client from './client';

export async function getAdminUsersApi() {
  const { data } = await client.get('/admin/users');
  return data;
}

export async function updateUserRoleApi(userId: string, role: string) {
  const { data } = await client.patch(`/admin/users/${userId}/role`, { role });
  return data;
}

export async function deleteUserApi(userId: string) {
  const { data } = await client.delete(`/admin/users/${userId}`);
  return data;
}

export async function getAdminStatsApi() {
  const { data } = await client.get('/admin/stats');
  return data;
}
