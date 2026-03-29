import client from './client';

export async function getChildrenApi() {
  const { data } = await client.get('/parent/children');
  return data;
}
