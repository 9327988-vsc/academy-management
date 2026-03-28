import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './Header';
import { useAuthStore } from '@/stores/authStore';
import { getMeApi } from '@/api/auth.api';

export default function Layout() {
  const { setUser, user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      getMeApi()
        .then((res) => {
          if (res.success) setUser(res.data);
        })
        .catch(() => {});
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
