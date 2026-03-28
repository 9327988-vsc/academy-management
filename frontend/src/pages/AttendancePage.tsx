import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getClassByIdApi } from '@/api/class.api';
import { createSessionApi, bulkAttendanceApi } from '@/api/session.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Student } from '@/types';

type AttendanceStatus = 'present' | 'absent' | 'late' | null;

export default function AttendancePage() {
  const { id: classId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState<{ name: string; subject: string; startTime: string; endTime: string } | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [sessionForm, setSessionForm] = useState({
    topic: '', textbook: '', pages: '', keyConcepts: '',
    homework: '', homeworkDueDate: '', nextTopic: '', specialNotes: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!classId) return;
    getClassByIdApi(classId)
      .then((res) => {
        if (res.success) {
          setClassInfo(res.data);
          setStudents(res.data.students);
          const initial: Record<string, AttendanceStatus> = {};
          res.data.students.forEach((s: Student) => { initial[s.id] = null; });
          setAttendance(initial);
        }
      })
      .catch(() => { toast.error('수업 정보를 불러올 수 없습니다.'); })
      .finally(() => setLoading(false));
  }, [classId]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const setAllStatus = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach((s) => { updated[s.id] = status; });
    setAttendance(updated);
  };

  const checkedCount = Object.values(attendance).filter((s) => s !== null).length;

  const handleSubmit = async () => {
    if (!classId || !classInfo) return;

    const unchecked = students.filter((s) => attendance[s.id] === null);
    if (unchecked.length > 0) {
      toast.warning(`출석이 체크되지 않은 학생이 ${unchecked.length}명 있습니다.`);
      return;
    }

    setSubmitting(true);
    try {
      // 1. 세션 생성
      const sessionRes = await createSessionApi({
        classId,
        sessionDate: today,
        startTime: classInfo.startTime,
        endTime: classInfo.endTime,
        topic: sessionForm.topic || undefined,
        textbook: sessionForm.textbook || undefined,
        pages: sessionForm.pages || undefined,
        keyConcepts: sessionForm.keyConcepts || undefined,
        homework: sessionForm.homework || undefined,
        homeworkDueDate: sessionForm.homeworkDueDate || undefined,
        nextTopic: sessionForm.nextTopic || undefined,
        specialNotes: sessionForm.specialNotes || undefined,
      });

      if (!sessionRes.success) return;

      // 2. 출석 일괄 등록
      const attendanceData = students.map((s) => ({
        studentId: s.id,
        status: attendance[s.id]!,
      }));

      await bulkAttendanceApi({
        sessionId: sessionRes.data.id,
        attendance: attendanceData,
      });

      // 3. 알림 페이지로 이동
      navigate(`/classes/${classId}/sessions/${sessionRes.data.id}/notify`);
    } catch {
      toast.error('수업 종료 처리에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-48 rounded-lg" /><Skeleton className="h-64 rounded-lg" /></div>;

  if (!classInfo) return <p className="text-muted-foreground">수업 정보를 불러올 수 없습니다.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm"><Link to="/classes">&larr; 뒤로</Link></Button>
        <h1 className="text-2xl font-bold">{classInfo.name} - 출석부</h1>
      </div>

      {/* 출석 체크 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">출석 체크 ({today})</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setAllStatus('present')}>전체 출석</Button>
              <Button size="sm" variant="outline" onClick={() => setAllStatus('absent')}>전체 결석</Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">출석: {checkedCount}/{students.length}명</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {students.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">등록된 학생이 없습니다.</p>
              <Button asChild variant="outline"><Link to={`/classes/${classId}/students`}>학생 관리로 이동</Link></Button>
            </div>
          ) : (
            students.map((s, i) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="font-medium">{i + 1}. {s.name}</span>
                <div className="flex gap-2">
                  {(['present', 'absent', 'late'] as const).map((status) => {
                    const labels = { present: '출석', absent: '결석', late: '지각' };
                    const isActive = attendance[s.id] === status;
                    return (
                      <Button
                        key={status} size="sm"
                        variant={isActive ? 'default' : 'outline'}
                        className={cn(
                          isActive && status === 'present' && 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
                          isActive && status === 'absent' && 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200',
                          isActive && status === 'late' && 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200',
                        )}
                        aria-label={`${s.name} ${labels[status]}`}
                        onClick={() => setStatus(s.id, status)}
                      >
                        {labels[status]}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 수업 종료 정보 입력 */}
      {students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">수업 종료 처리</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>교재명</Label>
                <Input value={sessionForm.textbook} onChange={(e) => setSessionForm((p) => ({ ...p, textbook: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>페이지</Label>
                <Input value={sessionForm.pages} onChange={(e) => setSessionForm((p) => ({ ...p, pages: e.target.value }))} placeholder="p.124-131" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>오늘 진도</Label>
              <Input value={sessionForm.topic} onChange={(e) => setSessionForm((p) => ({ ...p, topic: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>핵심 개념</Label>
              <Input value={sessionForm.keyConcepts} onChange={(e) => setSessionForm((p) => ({ ...p, keyConcepts: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>숙제</Label>
                <Input value={sessionForm.homework} onChange={(e) => setSessionForm((p) => ({ ...p, homework: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>숙제 마감일</Label>
                <Input type="date" value={sessionForm.homeworkDueDate} onChange={(e) => setSessionForm((p) => ({ ...p, homeworkDueDate: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>다음 수업 예고</Label>
              <Input value={sessionForm.nextTopic} onChange={(e) => setSessionForm((p) => ({ ...p, nextTopic: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>특이사항</Label>
              <Input value={sessionForm.specialNotes} onChange={(e) => setSessionForm((p) => ({ ...p, specialNotes: e.target.value }))} />
            </div>

            <div className="flex gap-4 pt-4">
              <Button asChild variant="outline"><Link to="/classes">취소</Link></Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? '처리 중...' : '알림 미리보기'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
