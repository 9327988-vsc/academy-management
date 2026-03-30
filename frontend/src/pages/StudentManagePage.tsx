import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClassStudentsApi, enrollStudentApi, unenrollStudentApi } from '@/api/class.api';
import { createStudentApi, deleteStudentApi } from '@/api/student.api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { Student } from '@/types';

export default function StudentManagePage() {
  const { id: classId } = useParams<{ id: string }>();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', grade: '', school: '',
    parentName: '', parentPhone: '', parentRel: '부',
  });

  const fetchStudents = useCallback(() => {
    if (!classId) return;
    getClassStudentsApi(classId)
      .then((res) => { if (res.success) setStudents(res.data.students); })
      .catch(() => { toast.error('학생 목록을 불러올 수 없습니다.'); })
      .finally(() => setLoading(false));
  }, [classId]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) return;

    try {
      const parents = form.parentName
        ? [{ name: form.parentName, phone: form.parentPhone, relationship: form.parentRel }]
        : [];

      const res = await createStudentApi({
        name: form.name,
        phone: form.phone || undefined,
        grade: form.grade || undefined,
        school: form.school || undefined,
        parents,
      });

      if (res.success) {
        await enrollStudentApi(classId, res.data.id);
        setOpen(false);
        setForm({ name: '', phone: '', grade: '', school: '', parentName: '', parentPhone: '', parentRel: '부' });
        fetchStudents();
      }
    } catch { toast.error('학생 추가에 실패했습니다.'); }
  };

  const handleRemove = async (studentId: string) => {
    if (!classId) return;
    await unenrollStudentApi(classId, studentId);
    fetchStudents();
  };

  const handleDelete = async (studentId: string) => {
    await deleteStudentApi(studentId);
    fetchStudents();
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
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
            <h1 className="text-2xl font-bold tracking-tight">학생 관리</h1>
            <p className="text-sm text-muted-foreground">
              {students.length > 0 ? `${students.length}명의 학생이 등록되어 있습니다` : '학생을 추가해주세요'}
            </p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              학생 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>학생 추가</DialogTitle>
              <DialogDescription>학생 및 학부모 정보를 입력하세요.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <p className="mb-3 text-sm font-medium">학생 정보</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">이름 *</Label>
                    <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="홍길동" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">학년</Label>
                    <Input value={form.grade} onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))} placeholder="중3" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">학교</Label>
                    <Input value={form.school} onChange={(e) => setForm((p) => ({ ...p, school: e.target.value }))} placeholder="OO중학교" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">전화번호</Label>
                    <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="010-0000-0000" />
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <p className="mb-3 text-sm font-medium">학부모 정보</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">이름</Label>
                    <Input value={form.parentName} onChange={(e) => setForm((p) => ({ ...p, parentName: e.target.value }))} placeholder="홍부모" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">전화번호</Label>
                    <Input value={form.parentPhone} onChange={(e) => setForm((p) => ({ ...p, parentPhone: e.target.value }))} placeholder="010-0000-0000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">관계</Label>
                    <Input value={form.parentRel} onChange={(e) => setForm((p) => ({ ...p, parentRel: e.target.value }))} />
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full">추가하기</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {students.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
            </div>
            <p className="mt-4 text-sm font-medium">아직 등록된 학생이 없습니다</p>
            <p className="mt-1 text-sm text-muted-foreground">학생을 추가하고 수업을 관리하세요.</p>
            <Button onClick={() => setOpen(true)} className="mt-6">학생 추가</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {students.map((s, i) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {s.name}
                      {s.grade && <span className="ml-1.5 text-muted-foreground">({s.grade})</span>}
                    </p>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      {s.school && <span>{s.school}</span>}
                      {s.phone && <span>{s.phone}</span>}
                      {s.parents.map((p) => (
                        <span key={p.id}>{p.name}({p.relationship}) {p.phone}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => handleRemove(s.id)}>
                    제거
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-xs text-destructive hover:text-destructive">
                        삭제
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>학생을 삭제하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{s.name}" 학생의 모든 정보가 영구 삭제됩니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(s.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">삭제</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
