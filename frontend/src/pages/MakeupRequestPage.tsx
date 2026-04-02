import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { getAvailableSlotsApi, createRequestApi } from '@/api/makeup.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Calendar, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MakeupSlot } from '@/types';

interface AvailableSlot {
  id: string;
  teacherName: string;
  className?: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  maxStudents: number;
  currentCount: number;
  remainingSpots: number;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${dateStr.split('T')[0]} (${days[d.getDay()]})`;
}

export default function MakeupRequestPage() {
  const { classId } = useParams<{ classId: string }>();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('studentId') || '';
  const attendanceId = searchParams.get('attendanceId') || '';
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedSlot, setSubmittedSlot] = useState<AvailableSlot | null>(null);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    setError(false);
    getAvailableSlotsApi({ studentId: studentId || undefined, classId })
      .then((res) => {
        if (res.success) {
          setSlots(res.data.slots || res.data || []);
        }
      })
      .catch(() => {
        setError(true);
        toast.error('보강 슬롯을 불러올 수 없습니다.');
      })
      .finally(() => setLoading(false));
  }, [classId]);

  const handleSubmit = async () => {
    if (!selectedSlotId || !classId) return;
    setSubmitting(true);
    try {
      if (!studentId || !attendanceId) {
        toast.error('학생 ID 또는 출석 기록 ID가 누락되었습니다.');
        setSubmitting(false);
        return;
      }
      const res = await createRequestApi({
        studentId,
        originalAttendanceId: attendanceId,
        slotId: selectedSlotId,
        studentNote: note || undefined,
      });
      if (res.success) {
        const slot = slots.find((s) => s.id === selectedSlotId);
        setSubmittedSlot(slot || null);
        setSubmitted(true);
        toast.success('보강이 신청되었습니다.');
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '보강 신청에 실패했습니다.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[100px] rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[80px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle size={20} />
        </div>
        <p className="mt-4 text-sm font-medium">보강 슬롯을 불러올 수 없습니다</p>
        <p className="mt-1 text-sm text-muted-foreground">잠시 후 다시 시도해주세요.</p>
      </div>
    );
  }

  if (submitted && submittedSlot) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle size={28} />
        </div>
        <h2 className="mt-6 text-xl font-bold">보강이 신청되었습니다</h2>
        <p className="mt-2 text-sm text-muted-foreground">선생님 승인 후 확정됩니다.</p>
        <Card className="mt-6 w-full max-w-sm text-left">
          <CardContent className="py-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">날짜</span>
                <span className="font-medium">{formatDate(submittedSlot.slotDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">시간</span>
                <span className="font-medium">{submittedSlot.startTime} ~ {submittedSlot.endTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">상태</span>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-700">대기중</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/student/dashboard">대시보드로 이동</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">보강 신청</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          원하는 보강 시간을 선택하고 신청해주세요.
        </p>
      </div>

      {/* Available Slots */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">보강 슬롯 선택</CardTitle>
        </CardHeader>
        <CardContent>
          {slots.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Calendar size={20} className="text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                현재 신청 가능한 보강 슬롯이 없습니다. 선생님에게 문의해주세요.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {slots.map((slot) => {
                const isFull = slot.remainingSpots <= 0;
                const isSelected = selectedSlotId === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={isFull}
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:bg-accent/50',
                      isFull && 'cursor-not-allowed opacity-50'
                    )}
                    aria-disabled={isFull}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}>
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="font-medium">{formatDate(slot.slotDate)}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {slot.startTime} ~ {slot.endTime}
                          </span>
                          {slot.teacherName && <span>{slot.teacherName}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'flex items-center gap-1 text-sm',
                        isFull ? 'text-red-600' : 'text-muted-foreground'
                      )}>
                        <Users size={14} />
                        {isFull ? '마감' : `잔여 ${slot.remainingSpots}석`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note */}
      {slots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">요청사항 (선택)</CardTitle>
          </CardHeader>
          <CardContent>
            <label htmlFor="makeup-request-note" className="sr-only">요청사항</label>
            <textarea
              id="makeup-request-note"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={3}
              placeholder="선생님께 전달할 요청사항을 입력해주세요."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
            />
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      {slots.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!selectedSlotId || submitting}
            className="min-w-[140px]"
          >
            {submitting ? '신청 중...' : '보강 신청하기'}
          </Button>
        </div>
      )}
    </div>
  );
}
