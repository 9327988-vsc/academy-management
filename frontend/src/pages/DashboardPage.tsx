import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStatsApi } from '@/api/dashboard.api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { DashboardStats } from '@/types';

function StatCard({
  label,
  value,
  unit,
  icon,
  accent,
}: {
  label: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight">{value}</span>
          <span className="text-sm font-medium text-muted-foreground">{unit}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ClassRow({
  cls,
}: {
  cls: { id: string; name: string; startTime: string; endTime: string };
}) {
  return (
    <div className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div>
          <p className="font-medium leading-none">{cls.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {cls.startTime} – {cls.endTime}
          </p>
        </div>
      </div>
      <Button asChild size="sm" className="opacity-80 transition-opacity group-hover:opacity-100">
        <Link to={`/classes/${cls.id}/attendance`}>출석 체크</Link>
      </Button>
    </div>
  );
}

function SessionRow({
  session,
}: {
  session: {
    id: string;
    classId: string;
    className: string;
    sessionDate: string;
    notificationSent: boolean;
  };
}) {
  const dateStr = new Date(session.sessionDate).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium leading-none">{session.className}</p>
          <p className="mt-1 text-xs text-muted-foreground">{dateStr}</p>
        </div>
      </div>
      <Badge variant={session.notificationSent ? 'default' : 'outline'}>
        {session.notificationSent ? '발송 완료' : '미발송'}
      </Badge>
    </div>
  );
}

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
      <Skeleton className="h-[200px] rounded-xl" />
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">데이터를 불러올 수 없습니다</p>
        <p className="mt-1 text-sm text-muted-foreground">잠시 후 다시 시도해주세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          오늘의 수업과 학원 현황을 한눈에 확인하세요.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="오늘 수업"
          value={stats.todayClasses}
          unit="개"
          accent="bg-primary/10 text-primary"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
        <StatCard
          label="전체 학생"
          value={stats.totalStudents}
          unit="명"
          accent="bg-green-50 text-green-600"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <StatCard
          label="전체 수업"
          value={stats.totalClasses}
          unit="개"
          accent="bg-violet-50 text-violet-600"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          }
        />
      </div>

      {/* 오늘 수업 목록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">오늘의 수업</CardTitle>
              <CardDescription className="mt-1">
                {stats.todayClassList.length > 0
                  ? `${stats.todayClassList.length}개의 수업이 예정되어 있습니다`
                  : '오늘 예정된 수업이 없습니다'}
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/classes">전체 보기</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stats.todayClassList.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">오늘은 수업이 없는 날입니다.</p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/classes">수업 관리로 이동</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.todayClassList.map((cls) => (
                <ClassRow key={cls.id} cls={cls} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 최근 수업 기록 */}
      {stats.recentSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">최근 수업 기록</CardTitle>
            <CardDescription>최근 진행된 수업과 알림 발송 상태</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {stats.recentSessions.map((s) => (
                <SessionRow key={s.id} session={s} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
