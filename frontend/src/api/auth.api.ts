import client from './client';

export async function loginApi(email: string, password: string) {
  const { data } = await client.post('/auth/login', { email, password });
  return data;
}

export async function registerApi(params: {
  email: string;
  password: string;
  name: string;
  phone: string;
}) {
  const { data } = await client.post('/auth/register', params);
  return data;
}

export async function logoutApi() {
  const { data } = await client.post('/auth/logout');
  return data;
}

export async function getMeApi() {
  const { data } = await client.get('/users/me');
  return data;
}
