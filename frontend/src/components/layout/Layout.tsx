import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './Header';
import { useAuthStore } from '@/stores/authStore';
import { getMeApi } from '@/api/auth.api';

export default function Layout() {
  const { setUser, user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      console.log('[Layout] getMeApi 호출');
      getMeApi()
        .then((res) => {
          console.log('[Layout] getMeApi 응답:', res);
          if (res.success) setUser(res.data);
        })
        .catch((err) => {
          console.error('[Layout] getMeApi 에러:', err?.response?.status, err?.response?.data);
        });
    }
  }, [user, setUser]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
