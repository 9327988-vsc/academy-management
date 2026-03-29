import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getClassesApi, createClassApi, deleteClassApi } from '@/api/class.api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { Class } from '@/types';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export default function ClassListPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', subject: '', days: [] as string[],
    startTime: '17:00', endTime: '19:00', room: '', maxStudents: '15',
  });

  const fetchClasses = () => {
    getClassesApi()
      .then((res) => { if (res.success) setClasses(res.data.classes); })
      .catch(() => { toast.error('수업 목록을 불러올 수 없습니다.'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClasses(); }, []);

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day],
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createClassApi({
        name: form.name,
        subject: form.subject,
        dayOfWeek: form.days.join(','),
        startTime: form.startTime,
        endTime: form.endTime,
        room: form.room || undefined,
        maxStudents: parseInt(form.maxStudents) || 15,
      });
      setOpen(false);
      setForm({ name: '', subject: '', days: [], startTime: '17:00', endTime: '19:00', room: '', maxStudents: '15' });
      fetchClasses();
    } catch { toast.error('수업 생성에 실패했습니다.'); }
  };

  const handleDelete = async (id: string) => {
    await deleteClassApi(id);
    fetchClasses();
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="mt-1 h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[180px] rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">내 수업 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {classes.length > 0 ? `총 ${classes.length}개의 수업을 관리하고 있습니다` : '수업을 만들어 시작해보세요'}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              새 수업
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 수업 만들기</DialogTitle>
              <DialogDescription>수업 정보를 입력하고 생성하세요.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>수업명 *</Label>
                  <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="중등 수학 A반" required />
                </div>
                <div className="space-y-2">
                  <Label>과목 *</Label>
                  <Input value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} placeholder="수학" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>수업 요일 *</Label>
                <div className="flex gap-1.5">
                  {DAYS.map((day) => (
                    <button
                      key={day} type="button"
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                        form.days.includes(day)
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-input bg-background hover:bg-accent'
                      }`}
                      onClick={() => toggleDay(day)}
                    >{day}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>시작 시간</Label>
                  <Input type="time" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>종료 시간</Label>
                  <Input type="time" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>교실</Label>
                  <Input value={form.room} onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))} placeholder="3층 301호" />
                </div>
                <div className="space-y-2">
                  <Label>정원</Label>
                  <Input type="number" value={form.maxStudents} onChange={(e) => setForm((p) => ({ ...p, maxStudents: e.target.value }))} />
                </div>
              </div>
              <Button type="submit" className="w-full">생성하기</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-medium">아직 등록된 수업이 없습니다</p>
            <p className="mt-1 text-sm text-muted-foreground">새 수업을 만들어 학원 관리를 시작하세요.</p>
            <Button onClick={() => setOpen(true)} className="mt-6">수업 만들기</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card key={cls.id} className="group transition-colors hover:bg-accent/30">
              <CardContent className="p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold leading-none">{cls.name}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{cls.subject}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {cls.studentCount}/{cls.maxStudents}명
                  </Badge>
                </div>
                <div className="mb-4 space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    {cls.dayOfWeek}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    {cls.startTime} – {cls.endTime}
                  </div>
                  {cls.room && (
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                      {cls.room}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 border-t border-border pt-4">
                  <Button asChild size="sm" className="flex-1">
                    <Link to={`/classes/${cls.id}/attendance`}>출석부</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link to={`/classes/${cls.id}/students`}>학생</Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>수업을 삭제하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{cls.name}" 수업의 모든 학생 연결, 출석 기록, 알림이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(cls.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">삭제</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
