import { useEffect, useState } from 'react';
import { getAdminUsersApi, updateUserRoleApi, deleteUserApi } from '@/api/admin.api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { Users, Trash2, Shield, Search } from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
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

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const currentUserId = useAuthStore((s) => s.user?.id);

  const fetchUsers = () => {
    getAdminUsersApi()
      .then((res) => { if (res.success) setUsers(res.data.users); })
      .catch(() => toast.error('사용자 목록을 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRoleApi(userId, newRole);
      toast.success('역할이 변경되었습니다.');
      fetchUsers();
    } catch {
      toast.error('역할 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await deleteUserApi(userId);
      toast.success('사용자가 삭제되었습니다.');
      fetchUsers();
    } catch {
      toast.error('사용자 삭제에 실패했습니다.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch = !searchTerm ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users size={22} />
          사용자 관리
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">등록된 사용자 목록과 역할을 관리합니다. ({users.length}명)</p>
      </div>

      {/* 검색 & 필터 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="이름 또는 이메일 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">전체 역할</option>
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* 사용자 목록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-primary" />
            <div>
              <CardTitle className="text-base">사용자 목록</CardTitle>
              <CardDescription>
                {filteredUsers.length === users.length
                  ? `총 ${users.length}명`
                  : `${filteredUsers.length}명 / ${users.length}명`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</p>
          ) : (
            <div className="divide-y divide-border">
              {filteredUsers.map((u) => (
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
                      <p className="text-xs text-muted-foreground">
                        {u.email} · {u.phone} · {new Date(u.createdAt).toLocaleDateString('ko-KR')}
                      </p>
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
                              &quot;{u.name}&quot; ({u.email}) 계정이 영구 삭제됩니다.
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
