import { useEffect, useState } from 'react';
import { getAdminUsersApi, updateUserRoleApi, deleteUserApi, getAdminStatsApi } from '@/api/admin.api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { Users, BookOpen, GraduationCap, BarChart3, Trash2, Shield } from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

interface SystemStats {
  users: number;
  classes: number;
  students: number;
  sessions: number;
  usersByRole: { role: string; count: number }[];
}

const ROLE_OPTIONS = [
  { value: 'teacher', label: '선생님' },
  { value: 'principal', label: '관리자' },
  { value: 'parent', label: '학부모' },
  { value: 'student', label: '학생' },
] as const;

const ROLE_BADGE: Record<string, string> = {
  principal: 'bg-amber-100 text-amber-700 border-amber-200',
  teacher: 'bg-blue-100 text-blue-700 border-blue-200',
  parent: 'bg-green-100 text-green-700 border-green-200',
  student: 'bg-violet-100 text-violet-700 border-violet-200',
};

export default function SettingsPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const fetchData = () => {
    Promise.all([
      getAdminUsersApi().then((res) => { if (res.success) setUsers(res.data.users); }),
      getAdminStatsApi().then((res) => { if (res.success) setStats(res.data); }),
    ])
      .catch(() => { toast.error('관리자 데이터를 불러올 수 없습니다.'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRoleApi(userId, newRole);
      toast.success('역할이 변경되었습니다.');
      fetchData();
    } catch {
      toast.error('역할 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await deleteUserApi(userId);
      toast.success('사용자가 삭제되었습니다.');
      fetchData();
    } catch {
      toast.error('사용자 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  const statCards = stats ? [
    { label: '사용자', value: stats.users, icon: Users, accent: 'bg-blue-50 text-blue-600' },
    { label: '수업', value: stats.classes, icon: BookOpen, accent: 'bg-green-50 text-green-600' },
    { label: '학생', value: stats.students, icon: GraduationCap, accent: 'bg-violet-50 text-violet-600' },
    { label: '수업 기록', value: stats.sessions, icon: BarChart3, accent: 'bg-amber-50 text-amber-600' },
  ] : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">관리자 설정</h1>
        <p className="mt-1 text-sm text-muted-foreground">학원 시스템을 관리하고 사용자 권한을 설정하세요.</p>
      </div>

      {/* 시스템 통계 */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, accent }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-3 py-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 사용자 관리 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-primary" />
            <div>
              <CardTitle className="text-base">사용자 관리</CardTitle>
              <CardDescription>등록된 사용자 목록과 역할을 관리합니다. ({users.length}명)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{u.name}</p>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${ROLE_BADGE[u.role] || ''}`}>
                        {ROLE_OPTIONS.find((r) => r.value === u.role)?.label || u.role}
                      </Badge>
                      {u.id === currentUserId && (
                        <span className="text-[10px] text-muted-foreground">(나)</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{u.email} · {u.phone}</p>
                  </div>
                </div>

                {u.id !== currentUserId && (
                  <div className="flex items-center gap-2">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                          <Trash2 size={14} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>사용자를 삭제하시겠습니까?</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{u.name}" ({u.email}) 계정이 영구 삭제됩니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(u.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            삭제
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
