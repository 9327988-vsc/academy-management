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
import { LayoutDashboard, BookOpen, Settings, LogOut, ChevronDown, Users, GraduationCap } from 'lucide-react';

function getNavItems(role?: string) {
  if (role === 'parent') {
    return [
      { to: '/parent/dashboard', label: '대시보드', icon: LayoutDashboard },
    ];
  }
  if (role === 'student') {
    return [
      { to: '/student/dashboard', label: '대시보드', icon: GraduationCap },
    ];
  }
  const items = [
    { to: '/dashboard', label: '대시보드', icon: LayoutDashboard },
    { to: '/classes', label: '수업', icon: BookOpen },
  ];
  if (role === 'principal') {
    items.push({ to: '/admin/settings', label: '설정', icon: Settings });
  }
  return items;
}

function getRoleBadge(role?: string) {
  switch (role) {
    case 'principal': return { label: '관리자', className: 'bg-amber-100 text-amber-700 border-amber-200' };
    case 'parent': return { label: '학부모', className: 'bg-green-100 text-green-700 border-green-200' };
    case 'student': return { label: '학생', className: 'bg-violet-100 text-violet-700 border-violet-200' };
    default: return { label: '선생님', className: 'bg-blue-100 text-blue-700 border-blue-200' };
  }
}

export default function Header() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = getNavItems(user?.role);
  const roleBadge = getRoleBadge(user?.role);
  const homePath = user?.role === 'parent' ? '/parent/dashboard'
    : user?.role === 'student' ? '/student/dashboard'
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
              const isActive = location.pathname === to || (to === '/classes' && location.pathname.startsWith('/classes'));
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
    </header>
  );
}
