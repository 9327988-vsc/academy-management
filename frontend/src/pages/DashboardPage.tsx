import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStatsApi } from '@/api/dashboard.api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Calendar, Users, BookOpen, Clock, AlertCircle, ArrowRight } from 'lucide-react';

interface DashboardData {
  todayClasses: number;
  totalStudents: number;
  totalClasses: number;
  todayClassList: {
    id: number;
    name: string;
    schedule?: string;
    currentStudents?: number;
  }[];
  recentAttendance: any[];
}

const STAT_CONFIG = [
  { key: 'todayClasses' as const, label: '오늘 수업', unit: '개', icon: Calendar, accent: 'bg-blue-50 text-blue-600' },
  { key: 'totalStudents' as const, label: '전체 학생', unit: '명', icon: Users, accent: 'bg-green-50 text-green-600' },
  { key: 'totalClasses' as const, label: '전체 수업', unit: '개', icon: BookOpen, accent: 'bg-violet-50 text-violet-600' },
] as const;

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-1 h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[104px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[240px] rounded-xl" />
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStatsApi()
      .then((res) => { if (res.success) setStats(res.data); })
      .catch(() => { toast.error('대시보드 데이터를 불러올 수 없습니다.'); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle size={20} />
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">데이터를 불러올 수 없습니다</p>
        <p className="mt-1 text-sm text-muted-foreground">잠시 후 다시 시도해주세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          오늘의 수업과 학원 현황을 한눈에 확인하세요.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STAT_CONFIG.map(({ key, label, unit, icon: Icon, accent }) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
                <Icon size={16} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight">{stats[key]}</span>
                <span className="text-sm font-medium text-muted-foreground">{unit}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 오늘 수업 목록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">수업 현황</CardTitle>
              <CardDescription className="mt-1">
                {stats.todayClassList.length > 0
                  ? `${stats.todayClassList.length}개의 활성 수업이 있습니다`
                  : '등록된 수업이 없습니다'}
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/classes" className="gap-1">
                전체 보기 <ArrowRight size={14} />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stats.todayClassList.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Calendar size={20} className="text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">등록된 수업이 없습니다.</p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/classes">수업 관리로 이동</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.todayClassList.map((cls) => (
                <div key={cls.id} className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="font-medium leading-none">{cls.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {cls.schedule || '일정 미정'}
                        {cls.currentStudents !== undefined && ` · ${cls.currentStudents}명`}
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" className="opacity-80 transition-opacity group-hover:opacity-100">
                    <Link to={`/classes/${cls.id}`}>상세보기</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
