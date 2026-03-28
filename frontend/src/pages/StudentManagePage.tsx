import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClassStudentsApi, enrollStudentApi, unenrollStudentApi } from '@/api/class.api';
import { createStudentApi, deleteStudentApi } from '@/api/student.api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

  const fetchStudents = () => {
    if (!classId) return;
    getClassStudentsApi(classId)
      .then((res) => { if (res.success) setStudents(res.data.students); })
      .catch(() => { toast.error('학생 목록을 불러올 수 없습니다.'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStudents(); }, [classId]);

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
    return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm"><Link to="/classes">&larr; 뒤로</Link></Button>
          <h1 className="text-2xl font-bold">학생 관리</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>+ 학생 추가</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>학생 추가</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">학생 정보</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>이름 *</Label>
                  <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>학년</Label>
                  <Input value={form.grade} onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))} placeholder="중3" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>학교</Label>
                  <Input value={form.school} onChange={(e) => setForm((p) => ({ ...p, school: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>전화번호</Label>
                  <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground pt-2">학부모 정보</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>이름</Label>
                  <Input value={form.parentName} onChange={(e) => setForm((p) => ({ ...p, parentName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>전화번호</Label>
                  <Input value={form.parentPhone} onChange={(e) => setForm((p) => ({ ...p, parentPhone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>관계</Label>
                  <Input value={form.parentRel} onChange={(e) => setForm((p) => ({ ...p, parentRel: e.target.value }))} />
                </div>
              </div>
              <Button type="submit" className="w-full">추가하기</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-sm text-muted-foreground">전체 학생: {students.length}명</p>

      {students.length === 0 ? (
        <Card><CardContent className="text-center py-12">
          <p className="text-muted-foreground mb-4">아직 등록된 학생이 없습니다.</p>
          <Button onClick={() => setOpen(true)}>학생 추가</Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {students.map((s, i) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{i + 1}. {s.name} {s.grade && <span className="text-muted-foreground">({s.grade})</span>}</p>
                    {s.phone && <p className="text-sm text-muted-foreground">전화: {s.phone}</p>}
                    {s.school && <p className="text-sm text-muted-foreground">학교: {s.school}</p>}
                    {s.parents.map((p) => (
                      <p key={p.id} className="text-sm text-muted-foreground">
                        학부모: {p.name} ({p.relationship}) {p.phone}
                      </p>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleRemove(s.id)}>수업에서 제거</Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDelete(s.id)}>삭제</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
