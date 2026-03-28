import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getClassesApi, createClassApi, deleteClassApi } from '@/api/class.api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">내 수업 관리</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>+ 새 수업 만들기</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 수업 만들기</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>수업명 *</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>과목 *</Label>
                <Input value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>수업 요일 *</Label>
                <div className="flex gap-2">
                  {DAYS.map((day) => (
                    <Button
                      key={day} type="button" size="sm"
                      variant={form.days.includes(day) ? 'default' : 'outline'}
                      onClick={() => toggleDay(day)}
                    >{day}</Button>
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
                  <Input value={form.room} onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))} />
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
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">아직 등록된 수업이 없습니다.</p>
            <Button onClick={() => setOpen(true)}>수업 만들어 시작하기</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <Card key={cls.id}>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{cls.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {cls.subject} {cls.room && `| ${cls.room}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {cls.dayOfWeek} {cls.startTime}-{cls.endTime}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    학생: {cls.studentCount}/{cls.maxStudents}명
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Link to={`/classes/${cls.id}/attendance`}>
                    <Button size="sm" variant="default">출석부</Button>
                  </Link>
                  <Link to={`/classes/${cls.id}/students`}>
                    <Button size="sm" variant="outline">학생 관리</Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-destructive">삭제</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>수업을 삭제하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                          이 수업의 모든 학생 연결, 출석 기록, 알림이 삭제됩니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(cls.id)}>삭제</AlertDialogAction>
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
