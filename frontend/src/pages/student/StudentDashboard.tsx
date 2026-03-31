import { useEffect, useState } from 'react';
import { getStudentDashboardApi } from '@/api/studentPortal.api';
import { getDevStudentDashboardApi } from '@/api/admin.api';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Calendar, Clock, CheckCircle, XCircle, AlertTriangle, BookOpen, TrendingUp, User, Wrench } from 'lucide-react';

interface StudentData {
  name: string;
  grade: string | null;
  school: string | null;
  attendanceRate: number;
  stats: { total: number; present: number; late: number; absent: number };
  classes: { id: string; name: string; subject: string; dayOfWeek: string; startTime: string; endTime: string; room: string | null }[];
  recentAttendance: { date: string; className: string; status: string }[];
}

const STATUS_CONFIG = {
  present: { label: '출석', icon: CheckCircle, className: 'text-green-600 bg-green-50' },
  absent: { label: '결석', icon: XCircle, className: 'text-red-600 bg-red-50' },
  late: { label: '지각', icon: AlertTriangle, className: 'text-yellow-600 bg-yellow-50' },
} as const;

export default function StudentDashboard() {
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const viewAsRole = useAuthStore((s) => s.viewAsRole);
  const isDevMode = user?.role === 'ADMIN' && viewAsRole === 'STUDENT';

  useEffect(() => {
    if (!user) return; // user 로드 대기 (페이지 새로고침 시 getMeApi 완료 후 실행)
    const api = isDevMode ? getDevStudentDashboardApi() : getStudentDashboardApi();
    api
      .then((res) => { if (res.success) setData(res.data); })
      .catch(() => { toast.error('정보를 불러올 수 없습니다.'); })
      .finally(() => setLoading(false));
  }, [isDevMode, user]);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        {isDevMode && (
          <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2.5 text-sm text-yellow-800">
            <Wrench size={14} />
            <span className="font-medium">개발자 모드:</span> 테스트 학생 데이터가 없습니다. seed를 실행해주세요.
          </div>
        )}
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <User size={20} className="text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-medium">연결된 학생 정보가 없습니다</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isDevMode ? 'DB에 학생 데이터가 없습니다. npx prisma db seed를 실행해주세요.' : '학원에 문의하여 계정을 연결해주세요.'}
          </p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: '출석률', value: `${data.attendanceRate}%`, icon: TrendingUp, accent: 'bg-blue-50 text-blue-600' },
    { label: '출석', value: `${data.stats.present}회`, icon: CheckCircle, accent: 'bg-green-50 text-green-600' },
    { label: '지각', value: `${data.stats.late}회`, icon: AlertTriangle, accent: 'bg-yellow-50 text-yellow-600' },
    { label: '결석', value: `${data.stats.absent}회`, icon: XCircle, accent: 'bg-red-50 text-red-600' },
  ];

  return (
    <div className="space-y-8">
      {isDevMode && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2.5 text-sm text-yellow-800">
          <Wrench size={14} />
          <span className="font-medium">개발자 모드:</span> 테스트 학생 데이터를 사용 중입니다
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">안녕하세요, {data.name}!</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.grade && `${data.grade}`}{data.school && ` · ${data.school}`} · 수업 현황을 확인하세요.
        </p>
      </div>

      {/* 출석 통계 */}
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

      {/* 수업 시간표 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">내 수업</CardTitle>
          <CardDescription>{data.classes.length}개의 수업에 등록되어 있습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.classes.map((cls) => (
              <div key={cls.id} className="flex items-center gap-4 rounded-lg border border-border p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{cls.name}</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {cls.dayOfWeek}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {cls.startTime} – {cls.endTime}</span>
                    {cls.room && <span>{cls.room}</span>}
                  </div>
                </div>
                <Badge variant="outline">{cls.subject}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 최근 출석 기록 */}
      {data.recentAttendance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">최근 출석 기록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {data.recentAttendance.map((a, i) => {
                const config = STATUS_CONFIG[a.status as keyof typeof STATUS_CONFIG];
                const Icon = config?.icon || CheckCircle;
                return (
                  <div key={i} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium">{a.className}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}
                      </p>
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
  );
}
