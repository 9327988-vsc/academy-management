import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface RoleGuardProps {
  allowedRoles: string[];
  redirectTo?: string;
}

export default function RoleGuard({ allowedRoles, redirectTo = '/dashboard' }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);
  const effectiveRole = useAuthStore((s) => s.effectiveRole)();

  if (!user || !effectiveRole || !allowedRoles.includes(effectiveRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
