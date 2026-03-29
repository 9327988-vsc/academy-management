import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getClassByIdApi } from '@/api/class.api';
import { createSessionApi, bulkAttendanceApi } from '@/api/session.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-[300px] rounded-xl" />
        <Skeleton className="h-[250px] rounded-xl" />
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        </div>
        <p className="mt-4 text-sm font-medium">수업 정보를 불러올 수 없습니다</p>
        <Button asChild variant="outline" size="sm" className="mt-4"><Link to="/classes">수업 목록으로</Link></Button>
      </div>
    );
  }

  const presentCount = Object.values(attendance).filter((s) => s === 'present').length;
  const absentCount = Object.values(attendance).filter((s) => s === 'absent').length;
  const lateCount = Object.values(attendance).filter((s) => s === 'late').length;

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
            <p className="text-sm text-muted-foreground">{today} 출석부</p>
          </div>
        </div>
      </div>

      {/* 출석 체크 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">출석 체크</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {checkedCount}/{students.length}명 체크 완료
                {checkedCount > 0 && (
                  <span className="ml-2">
                    (<span className="text-green-600">{presentCount}</span>
                    {absentCount > 0 && <> / <span className="text-red-600">{absentCount}</span></>}
                    {lateCount > 0 && <> / <span className="text-yellow-600">{lateCount}</span></>})
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={() => setAllStatus('present')} className="text-xs">전체 출석</Button>
              <Button size="sm" variant="outline" onClick={() => setAllStatus('absent')} className="text-xs">전체 결석</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">등록된 학생이 없습니다.</p>
              <Button asChild variant="outline" size="sm" className="mt-4"><Link to={`/classes/${classId}/students`}>학생 관리로 이동</Link></Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {students.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                      attendance[s.id] === 'present' && 'bg-green-100 text-green-700',
                      attendance[s.id] === 'absent' && 'bg-red-100 text-red-700',
                      attendance[s.id] === 'late' && 'bg-yellow-100 text-yellow-700',
                      !attendance[s.id] && 'bg-muted text-muted-foreground',
                    )}>
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium">{s.name}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {(['present', 'absent', 'late'] as const).map((status) => {
                      const config = {
                        present: { label: '출석', active: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' },
                        absent: { label: '결석', active: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' },
                        late: { label: '지각', active: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200' },
                      }[status];
                      const isActive = attendance[s.id] === status;
                      return (
                        <button
                          key={status}
                          type="button"
                          className={cn(
                            'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                            isActive ? config.active : 'border-input bg-background text-muted-foreground hover:bg-accent',
                          )}
                          aria-label={`${s.name} ${config.label}`}
                          onClick={() => setStatus(s.id, status)}
                        >
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 수업 종료 정보 입력 */}
      {students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">수업 종료 처리</CardTitle>
            <p className="text-sm text-muted-foreground">수업 내용을 입력하고 알림을 발송하세요.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">교재명</Label>
                <Input value={sessionForm.textbook} onChange={(e) => setSessionForm((p) => ({ ...p, textbook: e.target.value }))} placeholder="개념원리 수학" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">페이지</Label>
                <Input value={sessionForm.pages} onChange={(e) => setSessionForm((p) => ({ ...p, pages: e.target.value }))} placeholder="p.124-131" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">오늘 진도</Label>
              <Input value={sessionForm.topic} onChange={(e) => setSessionForm((p) => ({ ...p, topic: e.target.value }))} placeholder="이차방정식의 풀이" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">핵심 개념</Label>
              <Input value={sessionForm.keyConcepts} onChange={(e) => setSessionForm((p) => ({ ...p, keyConcepts: e.target.value }))} placeholder="근의 공식, 판별식" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">숙제</Label>
                <Input value={sessionForm.homework} onChange={(e) => setSessionForm((p) => ({ ...p, homework: e.target.value }))} placeholder="교재 p.132 1~10번" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">숙제 마감일</Label>
                <Input type="date" value={sessionForm.homeworkDueDate} onChange={(e) => setSessionForm((p) => ({ ...p, homeworkDueDate: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">다음 수업 예고</Label>
              <Input value={sessionForm.nextTopic} onChange={(e) => setSessionForm((p) => ({ ...p, nextTopic: e.target.value }))} placeholder="이차함수의 그래프" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">특이사항</Label>
              <Input value={sessionForm.specialNotes} onChange={(e) => setSessionForm((p) => ({ ...p, specialNotes: e.target.value }))} placeholder="중간고사 대비 특강 안내" />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              <Button asChild variant="ghost"><Link to="/classes">취소</Link></Button>
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
