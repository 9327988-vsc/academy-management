import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logoutApi } from '@/api/auth.api';
import { cn } from '@/lib/utils';
import { LayoutDashboard, BookOpen, Settings, LogOut, ChevronDown, GraduationCap, Users, UserCircle, Wrench, CreditCard, Megaphone, Activity, CalendarCheck } from 'lucide-react';
import type { Role } from '@/types/api.types';

function getNavItems(role?: string | null) {
  if (role === 'PARENT') {
    return [
      { to: '/parent/dashboard', label: '대시보드', icon: LayoutDashboard },
    ];
  }
  if (role === 'STUDENT') {
    return [
      { to: '/student/dashboard', label: '대시보드', icon: GraduationCap },
    ];
  }
  const items = [
    { to: '/dashboard', label: '대시보드', icon: LayoutDashboard },
    { to: '/classes', label: '수업', icon: BookOpen },
    { to: '/makeup/calendar', label: '보강관리', icon: CalendarCheck },
  ];
  if (role === 'ADMIN') {
    items.push(
      { to: '/admin/users', label: '사용자', icon: Users },
      { to: '/admin/payments', label: '결제', icon: CreditCard },
      { to: '/admin/announcements', label: '공지', icon: Megaphone },
      { to: '/admin/logs', label: '로그', icon: Activity },
      { to: '/admin/settings', label: '설정', icon: Settings },
    );
  }
  return items;
}

function getRoleBadge(role?: string) {
  switch (role) {
    case 'ADMIN': return { label: '관리자', className: 'bg-amber-100 text-amber-700 border-amber-200' };
    case 'PARENT': return { label: '학부모', className: 'bg-green-100 text-green-700 border-green-200' };
    case 'STUDENT': return { label: '학생', className: 'bg-violet-100 text-violet-700 border-violet-200' };
    default: return { label: '선생님', className: 'bg-blue-100 text-blue-700 border-blue-200' };
  }
}

const DEV_ROLES: { value: Role | null; label: string; icon: typeof Settings }[] = [
  { value: null, label: '관리자로 보기', icon: Settings },
  { value: 'TEACHER', label: '선생님으로 보기', icon: Users },
  { value: 'PARENT', label: '학부모로 보기', icon: UserCircle },
  { value: 'STUDENT', label: '학생으로 보기', icon: GraduationCap },
];

const ROLE_LABEL: Record<string, string> = {
  ADMIN: '관리자',
  TEACHER: '선생님',
  PARENT: '학부모',
  STUDENT: '학생',
};

export default function Header() {
  const { user, clearAuth, viewAsRole, setViewAsRole, effectiveRole } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const currentRole = effectiveRole();
  const navItems = getNavItems(currentRole);
  const roleBadge = getRoleBadge(currentRole ?? undefined);
  const homePath = currentRole === 'PARENT' ? '/parent/dashboard'
    : currentRole === 'STUDENT' ? '/student/dashboard'
    : '/dashboard';

  const handleLogout = async () => {
    try {
      await logoutApi();
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-blue-600 to-blue-700">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link to={homePath} className="flex items-center gap-2.5 font-bold text-white">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-xs font-bold">
              A
            </div>
            <span className="hidden sm:inline">학원 관리</span>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to || (to === '/classes' && location.pathname.startsWith('/classes')) || (to === '/makeup/calendar' && location.pathname.startsWith('/makeup'));
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* 개발자 모드 (관리자 전용) */}
          {user?.role === 'ADMIN' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-yellow-200 hover:bg-white/10 hover:text-yellow-100">
                  <Wrench size={14} />
                  <span className="hidden sm:inline text-xs">DEV</span>
                  {viewAsRole && (
                    <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 bg-yellow-400/20 text-yellow-200 border-yellow-400/40">
                      {ROLE_LABEL[viewAsRole] || viewAsRole}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {DEV_ROLES.map(({ value, label, icon: Icon }) => (
                  <DropdownMenuItem
                    key={label}
                    onClick={() => {
                      setViewAsRole(value);
                      navigate(value === 'PARENT' ? '/parent/dashboard' : value === 'STUDENT' ? '/student/dashboard' : '/dashboard');
                    }}
                    className={cn(viewAsRole === value || (!viewAsRole && value === null) ? 'bg-accent' : '')}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* 역할 전환 중 경고 배지 */}
          {viewAsRole && viewAsRole !== user?.role && (
            <Badge variant="outline" className="hidden sm:flex bg-yellow-100 text-yellow-800 border-yellow-300 text-[10px] px-1.5 py-0">
              {ROLE_LABEL[viewAsRole]}으로 보는 중
            </Badge>
          )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-white/10 hover:text-white">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-medium">
                {user?.name?.charAt(0) || '?'}
              </div>
              <span className="hidden sm:inline text-sm">{user?.name || '선생님'}</span>
              <ChevronDown size={14} className="text-blue-200" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{user?.name}</p>
                <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', roleBadge.className)}>
                  {roleBadge.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut size={14} className="mr-2" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
