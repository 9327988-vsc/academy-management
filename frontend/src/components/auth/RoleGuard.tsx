import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface RoleGuardProps {
  allowedRoles: string[];
  redirectTo?: string;
}

export default function RoleGuard({ allowedRoles, redirectTo = '/dashboard' }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
