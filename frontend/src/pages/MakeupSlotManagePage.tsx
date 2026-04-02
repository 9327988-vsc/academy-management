import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClassByIdApi } from '@/api/class.api';
import {
  getSlotsApi,
  createSlotApi,
  updateSlotApi,
  deleteSlotApi,
  getPendingRequestsApi,
  updateRequestStatusApi,
} from '@/api/makeup.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Calendar, Clock, Users, Plus, Trash2, Edit3, XCircle, CheckCircle, AlertCircle } from 'lucide-react';
import type { MakeupSlot, MakeupRequest } from '@/types';

interface SlotWithRequests extends MakeupSlot {
  requests?: { id: string; studentName: string; status: string }[];
}

interface PendingRequest {
  id: string;
  studentName: string;
  studentPhone?: string;
  originalDate: string;
  originalClassName: string;
  requestedSlot: {
    id: string;
    slotDate: string;
    startTime: string;
    endTime: string;
    currentCount: number;
    maxStudents: number;
  };
  studentNote?: string;
  requestedAt: string;
}

const SLOT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  AVAILABLE: { label: '신청가능', className: 'bg-green-100 text-green-700' },
  FULL: { label: '마감', className: 'bg-yellow-100 text-yellow-700' },
  CLOSED: { label: '종료', className: 'bg-slate-100 text-slate-600' },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${dateStr} (${days[d.getDay()]})`;
}

export default function MakeupSlotManagePage() {
  const { id: classId } = useParams<{ id: string }>();
  const [className, setClassName] = useState('');
  const [slots, setSlots] = useState<SlotWithRequests[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<SlotWithRequests | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    slotDate: '',
    startTime: '',
    endTime: '',
    maxStudents: '3',
  });

  const fetchData = async () => {
    if (!classId) return;
    setLoading(true);
    setError(false);
    try {
      // 슬롯 조회 시 필수 startDate/endDate 포함 (현재~3개월 후)
      const now = new Date();
      const startDate = now.toISOString().split('T')[0];
      const futureDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      const endDate = futureDate.toISOString().split('T')[0];
      const [classRes, slotsRes, pendingRes] = await Promise.all([
        getClassByIdApi(classId),
        getSlotsApi({ classId, startDate, endDate }),
        getPendingRequestsApi({ classId }),
      ]);
      if (classRes.success) setClassName(classRes.data.name);
      if (slotsRes.success) setSlots(slotsRes.data.slots || slotsRes.data || []);
      if (pendingRes.success) setPendingRequests(pendingRes.data.requests || pendingRes.data || []);
    } catch {
      setError(true);
      toast.error('데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [classId]);

  const resetForm = () => {
    setFormData({ slotDate: '', startTime: '', endTime: '', maxStudents: '3' });
    setEditingSlot(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (slot: SlotWithRequests) => {
    setEditingSlot(slot);
    setFormData({
      slotDate: slot.slotDate.split('T')[0],
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxStudents: String(slot.maxStudents),
    });
    setDialogOpen(true);
  };

  const handleSubmitSlot = async () => {
    if (!classId) return;
    if (!formData.slotDate || !formData.startTime || !formData.endTime) {
      toast.warning('날짜와 시간을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      if (editingSlot) {
        const res = await updateSlotApi(editingSlot.id, {
          slotDate: formData.slotDate,
          startTime: formData.startTime,
          endTime: formData.endTime,
          maxStudents: Number(formData.maxStudents),
        });
        if (res.success) {
          toast.success('보강 슬롯이 수정되었습니다.');
          setDialogOpen(false);
          resetForm();
          fetchData();
        }
      } else {
        const res = await createSlotApi({
          classId,
          slotDate: formData.slotDate,
          startTime: formData.startTime,
          endTime: formData.endTime,
          maxStudents: Number(formData.maxStudents),
        });
        if (res.success) {
          toast.success('보강 슬롯이 추가되었습니다.');
          setDialogOpen(false);
          resetForm();
          fetchData();
        }
      }
    } catch {
      toast.error(editingSlot ? '슬롯 수정에 실패했습니다.' : '슬롯 추가에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const res = await deleteSlotApi(slotId);
      if (res.success) {
        toast.success('보강 슬롯이 삭제되었습니다.');
        fetchData();
      }
    } catch {
      toast.error('슬롯 삭제에 실패했습니다.');
    }
  };

  const handleCloseSlot = async (slotId: string) => {
    try {
      const res = await updateSlotApi(slotId, { status: 'CLOSED' });
      if (res.success) {
        toast.success('보강 슬롯이 마감되었습니다.');
        fetchData();
      }
    } catch {
      toast.error('슬롯 마감에 실패했습니다.');
    }
  };

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const res = await updateRequestStatusApi(requestId, { action: 'APPROVE' });
      if (res.success) {
        toast.success('보강 신청이 승인되었습니다.');
        fetchData();
      }
    } catch {
      toast.error('승인 처리에 실패했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const res = await updateRequestStatusApi(requestId, { action: 'REJECT' });
      if (res.success) {
        toast.success('보강 신청이 거절되었습니다.');
        fetchData();
      }
    } catch {
      toast.error('거절 처리에 실패했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle size={20} />
        </div>
        <p className="mt-4 text-sm font-medium">데이터를 불러올 수 없습니다</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={fetchData}>다시 시도</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8" aria-label="수업 상세로 돌아가기">
            <Link to={`/classes/${classId}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{className}</h1>
            <p className="text-sm text-muted-foreground">보강 관리</p>
          </div>
        </div>
        <Button size="sm" onClick={handleOpenCreate} className="gap-1.5">
          <Plus size={14} />
          슬롯 추가
        </Button>
      </div>

      {/* Slot List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">보강 슬롯 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {slots.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Calendar size={20} className="text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                아직 보강 슬롯이 없습니다. 슬롯을 추가해 학생들이 보강 신청할 수 있도록 해주세요.
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={handleOpenCreate}>
                슬롯 추가
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {slots.map((slot) => {
                const statusConfig = SLOT_STATUS_CONFIG[slot.status] || SLOT_STATUS_CONFIG.AVAILABLE;
                return (
                  <div key={slot.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <p className="font-medium">{formatDate(slot.slotDate.split('T')[0])}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> {slot.startTime} ~ {slot.endTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users size={12} /> {slot.currentCount}/{slot.maxStudents}명
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={statusConfig.className}>
                          {statusConfig.label}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(slot)} aria-label="슬롯 수정">
                          <Edit3 size={14} />
                        </Button>
                        {slot.status !== 'CLOSED' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCloseSlot(slot.id)} aria-label="슬롯 마감">
                            <XCircle size={14} />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteSlot(slot.id)} aria-label="슬롯 삭제">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                    {slot.requests && slot.requests.length > 0 && (
                      <div className="mt-3 border-t border-border pt-3">
                        <p className="text-xs text-muted-foreground">
                          신청자: {slot.requests.map((r) => r.studentName).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            대기 중인 보강 신청 ({pendingRequests.length}건)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              대기 중인 보강 신청이 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{req.studentName}</p>
                      <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                        <p>결석일: {formatDate(req.originalDate)}</p>
                        <p>수업: {req.originalClassName}</p>
                        <p>
                          신청 슬롯: {req.requestedSlot.slotDate.split('T')[0]} {req.requestedSlot.startTime}~{req.requestedSlot.endTime}
                        </p>
                        {req.studentNote && (
                          <p className="mt-1 italic text-muted-foreground">
                            &quot;{req.studentNote}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(req.id)}
                      disabled={processingId === req.id}
                    >
                      {processingId === req.id ? '처리 중...' : '승인'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => handleReject(req.id)}
                      disabled={processingId === req.id}
                    >
                      거절
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSlot ? '보강 슬롯 수정' : '보강 슬롯 추가'}</DialogTitle>
            <DialogDescription>
              {editingSlot ? '보강 슬롯 정보를 수정합니다.' : '학생들이 신청할 수 있는 보강 시간을 추가합니다.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">날짜 *</Label>
              <Input
                type="date"
                value={formData.slotDate}
                onChange={(e) => setFormData((p) => ({ ...p, slotDate: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">시작 시간 *</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData((p) => ({ ...p, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">종료 시간 *</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData((p) => ({ ...p, endTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">정원 *</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={formData.maxStudents}
                onChange={(e) => setFormData((p) => ({ ...p, maxStudents: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSubmitSlot} disabled={submitting}>
              {submitting ? '처리 중...' : editingSlot ? '수정' : '슬롯 추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
