import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClassByIdApi, getClassSessionsApi } from '@/api/class.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    return <div className="space-y-4"><Skeleton className="h-32 rounded-lg" /><Skeleton className="h-64 rounded-lg" /></div>;
  }

  if (!classInfo) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">수업을 찾을 수 없습니다.</p>
        <Link to="/classes"><Button variant="outline" className="mt-4">수업 목록으로</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/classes"><Button variant="ghost" size="sm">&larr; 뒤로</Button></Link>
        <h1 className="text-2xl font-bold">{classInfo.name}</h1>
      </div>

      {/* 수업 정보 요약 */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">과목:</span> {classInfo.subject}</div>
            <div><span className="text-muted-foreground">요일:</span> {classInfo.dayOfWeek}</div>
            <div><span className="text-muted-foreground">시간:</span> {classInfo.startTime} - {classInfo.endTime}</div>
            <div><span className="text-muted-foreground">교실:</span> {classInfo.room || '-'}</div>
          </div>
          <div className="flex gap-2 mt-4">
            <Link to={`/classes/${classId}/attendance`}><Button size="sm">출석 체크</Button></Link>
            <Link to={`/classes/${classId}/students`}><Button size="sm" variant="outline">학생 관리</Button></Link>
          </div>
        </CardContent>
      </Card>

      {/* 탭: 학생 / 수업 기록 */}
      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">학생 ({classInfo.students.length}명)</TabsTrigger>
          <TabsTrigger value="sessions">수업 기록 ({sessions.length}건)</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-2 mt-4">
          {classInfo.students.length === 0 ? (
            <Card><CardContent className="text-center py-8">
              <p className="text-muted-foreground mb-4">등록된 학생이 없습니다.</p>
              <Link to={`/classes/${classId}/students`}><Button variant="outline">학생 추가</Button></Link>
            </CardContent></Card>
          ) : (
            classInfo.students.map((s, i) => (
              <Card key={s.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium">{i + 1}. {s.name}</span>
                    {s.grade && <span className="text-sm text-muted-foreground ml-2">({s.grade})</span>}
                    {s.school && <span className="text-sm text-muted-foreground ml-2">{s.school}</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {s.parents.map((p) => `${p.name}(${p.relationship})`).join(', ')}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-2 mt-4">
          {sessions.length === 0 ? (
            <Card><CardContent className="text-center py-8">
              <p className="text-muted-foreground">아직 수업 기록이 없습니다.</p>
            </CardContent></Card>
          ) : (
            sessions.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium">
                      {new Date(s.sessionDate).toLocaleDateString('ko-KR')}
                    </span>
                    {s.topic && <span className="text-sm text-muted-foreground ml-2">- {s.topic}</span>}
                  </div>
                  <Badge variant={s.notificationSent ? 'default' : 'secondary'}>
                    {s.notificationSent ? '알림 발송' : '미발송'}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
