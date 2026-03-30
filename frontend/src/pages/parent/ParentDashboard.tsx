import { useEffect, useState } from 'react';
import { getChildrenApi } from '@/api/parent.api';
import { getDevParentChildrenApi } from '@/api/admin.api';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Users, TrendingUp, Calendar, Clock, CheckCircle, XCircle, AlertTriangle, Wrench } from 'lucide-react';

interface ChildInfo {
  id: string;
  name: string;
  grade: string | null;
  school: string | null;
  attendanceRate: number;
  totalClasses: number;
  classes: { id: string; name: string; subject: string; dayOfWeek: string; startTime: string; endTime: string }[];
  recentAttendance: { date: string; className: string; status: string }[];
}

const STATUS_CONFIG = {
  present: { label: '출석', icon: CheckCircle, className: 'text-green-600 bg-green-50' },
  absent: { label: '결석', icon: XCircle, className: 'text-red-600 bg-red-50' },
  late: { label: '지각', icon: AlertTriangle, className: 'text-yellow-600 bg-yellow-50' },
} as const;

export default function ParentDashboard() {
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const viewAsRole = useAuthStore((s) => s.viewAsRole);
  const isDevMode = user?.role === 'principal' && viewAsRole === 'parent';

  useEffect(() => {
    const api = isDevMode ? getDevParentChildrenApi() : getChildrenApi();
    api
      .then((res) => { if (res.success) setChildren(res.data.children); })
      .catch(() => { toast.error('자녀 정보를 불러올 수 없습니다.'); })
      .finally(() => setLoading(false));
  }, [isDevMode]);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Users size={20} className="text-muted-foreground" />
        </div>
        <p className="mt-4 text-sm font-medium">연결된 자녀 정보가 없습니다</p>
        <p className="mt-1 text-sm text-muted-foreground">학원에 문의하여 계정을 연결해주세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {isDevMode && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2.5 text-sm text-yellow-800">
          <Wrench size={14} />
          <span className="font-medium">개발자 모드:</span> 테스트 학부모 데이터를 사용 중입니다
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">학부모 대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">자녀의 학원 출석과 수업 현황을 확인하세요.</p>
      </div>

      {children.map((child) => (
        <div key={child.id} className="space-y-4">
          {/* 자녀 요약 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{child.name}</CardTitle>
                  <CardDescription>
                    {child.grade && `${child.grade}`}{child.school && ` · ${child.school}`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className={child.attendanceRate >= 80 ? 'text-green-600' : 'text-yellow-600'} />
                  <span className={`text-2xl font-bold ${child.attendanceRate >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {child.attendanceRate}%
                  </span>
                  <span className="text-sm text-muted-foreground">출석률</span>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* 수업 목록 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {child.classes.map((cls) => (
              <Card key={cls.id} size="sm">
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{cls.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {cls.dayOfWeek} · {cls.startTime} – {cls.endTime}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 최근 출석 기록 */}
          {child.recentAttendance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">최근 출석 기록</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  {child.recentAttendance.map((a, i) => {
                    const config = STATUS_CONFIG[a.status as keyof typeof STATUS_CONFIG];
                    const Icon = config?.icon || CheckCircle;
                    return (
                      <div key={i} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-3">
                          <Clock size={14} className="text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{a.className}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(a.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={config?.className}>
                          <Icon size={12} className="mr-1" />
                          {config?.label || a.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ))}
    </div>
  );
}
