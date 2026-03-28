import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStatsApi } from '@/api/dashboard.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { DashboardStats } from '@/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStatsApi()
      .then((res) => { if (res.success) setStats(res.data); })
      .catch(() => { toast.error('대시보드 데이터를 불러올 수 없습니다.'); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-muted-foreground">데이터를 불러올 수 없습니다.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">오늘 수업</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.todayClasses}개</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">전체 학생</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalStudents}명</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">전체 수업</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalClasses}개</p>
          </CardContent>
        </Card>
      </div>

      {/* 오늘 수업 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">오늘의 수업</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.todayClassList.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">오늘은 수업이 없습니다.</p>
              <Link to="/classes">
                <Button variant="outline">수업 관리로 이동</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.todayClassList.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">{cls.name}</p>
                    <p className="text-sm text-muted-foreground">{cls.startTime} - {cls.endTime}</p>
                  </div>
                  <Link to={`/classes/${cls.id}/attendance`}>
                    <Button size="sm">출석 체크</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 최근 수업 기록 */}
      {stats.recentSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">최근 수업 기록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentSessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2">
                  <div>
                    <span className="font-medium">{s.className}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {new Date(s.sessionDate).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <Badge variant={s.notificationSent ? 'default' : 'secondary'}>
                    {s.notificationSent ? '발송 완료' : '미발송'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
