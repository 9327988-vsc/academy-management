import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClassByIdApi, getClassSessionsApi } from '@/api/class.api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import type { Student } from '@/types';

interface ClassInfo {
  id: string;
  name: string;
  subject: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
  maxStudents: number;
  students: Student[];
}

interface SessionItem {
  id: string;
  sessionDate: string;
  topic: string | null;
  notificationSent: boolean;
}

export default function ClassDetailPage() {
  const { id: classId } = useParams<{ id: string }>();
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;
    Promise.all([
      getClassByIdApi(classId).then((res) => { if (res.success) setClassInfo(res.data); }),
      getClassSessionsApi(classId).then((res) => { if (res.success) setSessions(res.data.sessions); }),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [classId]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-[120px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        </div>
        <p className="mt-4 text-sm font-medium">수업을 찾을 수 없습니다</p>
        <Button asChild variant="outline" size="sm" className="mt-4"><Link to="/classes">수업 목록으로</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link to="/classes">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{classInfo.name}</h1>
            <p className="text-sm text-muted-foreground">{classInfo.subject}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link to={`/classes/${classId}/attendance`}>출석 체크</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={`/classes/${classId}/students`}>학생 관리</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: '요일', value: classInfo.dayOfWeek },
              { label: '시간', value: `${classInfo.startTime} – ${classInfo.endTime}` },
              { label: '교실', value: classInfo.room || '미지정' },
              { label: '학생', value: `${classInfo.students.length}/${classInfo.maxStudents}명` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-0.5 text-sm font-medium">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">학생 ({classInfo.students.length})</TabsTrigger>
          <TabsTrigger value="sessions">수업 기록 ({sessions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-4">
          {classInfo.students.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">등록된 학생이 없습니다.</p>
                <Button asChild variant="outline" size="sm" className="mt-4"><Link to={`/classes/${classId}/students`}>학생 추가</Link></Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="divide-y divide-border">
                {classInfo.students.map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {i + 1}
                      </div>
                      <div>
                        <span className="text-sm font-medium">{s.name}</span>
                        {s.grade && <span className="ml-1.5 text-xs text-muted-foreground">{s.grade}</span>}
                        {s.school && <span className="ml-1.5 text-xs text-muted-foreground">{s.school}</span>}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {s.parents.map((p) => `${p.name}(${p.relationship})`).join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          {sessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">아직 수업 기록이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="divide-y divide-border">
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <span className="text-sm font-medium">
                        {new Date(s.sessionDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}
                      </span>
                      {s.topic && <span className="ml-2 text-sm text-muted-foreground">{s.topic}</span>}
                    </div>
                    <Badge variant={s.notificationSent ? 'default' : 'outline'}>
                      {s.notificationSent ? '발송 완료' : '미발송'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
