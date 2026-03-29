import { useEffect, useState } from 'react';
import { getAnnouncementsApi, createAnnouncementApi, updateAnnouncementApi, deleteAnnouncementApi } from '@/api/admin.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Megaphone, Plus, Trash2, Pencil, Star } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  important: boolean;
  createdAt: string;
  author: { id: string; name: string };
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', important: false });

  const fetchData = () => {
    getAnnouncementsApi()
      .then((res) => { if (res.success) setAnnouncements(res.data); })
      .catch(() => toast.error('공지사항을 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: '', content: '', important: false });
    setDialogOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditingId(a.id);
    setForm({ title: a.title, content: a.content, important: a.important });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content) {
      toast.error('제목과 내용을 입력해주세요.');
      return;
    }
    try {
      if (editingId) {
        await updateAnnouncementApi(editingId, form);
        toast.success('공지가 수정되었습니다.');
      } else {
        await createAnnouncementApi(form);
        toast.success('공지가 작성되었습니다.');
      }
      setDialogOpen(false);
      fetchData();
    } catch {
      toast.error('저장에 실패했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncementApi(id);
      toast.success('공지가 삭제되었습니다.');
      fetchData();
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  const toggleImportant = async (a: Announcement) => {
    try {
      await updateAnnouncementApi(a.id, { important: !a.important });
      toast.success(a.important ? '중요 표시 해제' : '중요 표시 설정');
      fetchData();
    } catch {
      toast.error('변경에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone size={22} />
            공지사항 관리
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">학원 공지사항을 작성하고 관리합니다.</p>
        </div>
        <Button onClick={openCreate} className="gap-1">
          <Plus size={16} /> 공지 작성
        </Button>
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            작성된 공지사항이 없습니다.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id} className={a.important ? 'border-amber-300 bg-amber-50/50' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {a.important && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 text-[10px] px-1.5 py-0">
                        중요
                      </Badge>
                    )}
                    <CardTitle className="text-base">{a.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toggleImportant(a)}>
                      <Star size={14} className={a.important ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'} />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(a)}>
                      <Pencil size={14} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                          <Trash2 size={14} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>공지를 삭제하시겠습니까?</AlertDialogTitle>
                          <AlertDialogDescription>
                            &quot;{a.title}&quot; 공지가 영구 삭제됩니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(a.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            삭제
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{a.content}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {a.author.name} · {new Date(a.createdAt).toLocaleDateString('ko-KR')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 작성/수정 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? '공지 수정' : '공지 작성'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>제목</Label>
              <Input
                placeholder="공지 제목"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>내용</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px] resize-y"
                placeholder="공지 내용을 입력하세요..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="important"
                checked={form.important}
                onChange={(e) => setForm({ ...form, important: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="important">중요 공지로 표시</Label>
            </div>
            <Button onClick={handleSubmit} className="w-full">
              {editingId ? '수정' : '작성'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
