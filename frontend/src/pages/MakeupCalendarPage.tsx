import { useEffect, useState } from 'react';
import { getSlotsApi, getPendingRequestsApi } from '@/api/makeup.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, AlertCircle } from 'lucide-react';

interface CalendarSlot {
  id: string;
  className?: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  maxStudents: number;
  currentCount: number;
  status: string;
  requests?: { id: string; studentName: string; status: string }[];
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function MakeupCalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    const startDate = formatDateKey(year, month, 1);
    const endDate = formatDateKey(year, month, new Date(year, month + 1, 0).getDate());
    try {
      const [slotsRes, pendingRes] = await Promise.all([
        getSlotsApi({ startDate, endDate }),
        getPendingRequestsApi(),
      ]);
      if (slotsRes.success) {
        setSlots(slotsRes.data.slots || slotsRes.data || []);
      }
      if (pendingRes.success) {
        const requests = pendingRes.data.requests || pendingRes.data || [];
        const counts: Record<string, number> = {};
        requests.forEach((r: { requestedSlot?: { slotDate?: string } }) => {
          const date = r.requestedSlot?.slotDate?.split('T')[0];
          if (date) counts[date] = (counts[date] || 0) + 1;
        });
        setPendingCounts(counts);
      }
    } catch {
      setError(true);
      toast.error('캘린더를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [year, month]);

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };

  const days = getMonthDays(year, month);

  // Group slots by date
  const slotsByDate: Record<string, CalendarSlot[]> = {};
  slots.forEach((slot) => {
    const dateKey = slot.slotDate.split('T')[0];
    if (!slotsByDate[dateKey]) slotsByDate[dateKey] = [];
    slotsByDate[dateKey].push(slot);
  });

  const selectedSlots = selectedDate ? slotsByDate[selectedDate] || [] : [];
  const selectedPendingCount = selectedDate ? pendingCounts[selectedDate] || 0 : 0;

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle size={20} />
        </div>
        <p className="mt-4 text-sm font-medium">캘린더를 불러올 수 없습니다</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={fetchData}>다시 시도</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">보강 캘린더</h1>
        <p className="mt-1 text-sm text-muted-foreground">보강 일정을 캘린더로 확인하세요.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Calendar Grid */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {year}년 {month + 1}월
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth} aria-label="이전 달">
                  <ChevronLeft size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth} aria-label="다음 달">
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px" role="grid" aria-label="보강 캘린더">
              {DAY_LABELS.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
                  {d}
                </div>
              ))}
              {days.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="h-14" />;
                }
                const dateKey = formatDateKey(year, month, day);
                const daySlots = slotsByDate[dateKey] || [];
                const dayPending = pendingCounts[dateKey] || 0;
                const isToday = dateKey === today.toISOString().split('T')[0];
                const isSelected = dateKey === selectedDate;
                const hasSlots = daySlots.length > 0;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDate(dateKey)}
                    className={cn(
                      'relative flex h-14 flex-col items-center justify-start rounded-md p-1 text-sm transition-colors',
                      isSelected
                        ? 'bg-primary/10 ring-2 ring-primary/30'
                        : hasSlots
                          ? 'hover:bg-accent/50'
                          : 'hover:bg-accent/30',
                      isToday && 'font-bold'
                    )}
                    aria-label={`${month + 1}월 ${day}일${hasSlots ? `, 보강 ${daySlots.length}건` : ''}`}
                  >
                    <span className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                      isToday && 'bg-primary text-primary-foreground'
                    )}>
                      {day}
                    </span>
                    {hasSlots && (
                      <div className="mt-0.5 flex items-center gap-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span className="text-[10px] text-primary">{daySlots.length}</span>
                      </div>
                    )}
                    {dayPending > 0 && (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-yellow-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Day Detail Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              {selectedDate ? (
                <>
                  {selectedDate.split('-')[1]}월 {selectedDate.split('-')[2]}일 보강
                  {selectedSlots.length > 0 && ` (${selectedSlots.length}건)`}
                </>
              ) : (
                '날짜를 선택하세요'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                캘린더에서 날짜를 클릭하면 해당일 보강 정보를 볼 수 있습니다.
              </p>
            ) : selectedSlots.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                선택한 날짜에 보강이 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedSlots.map((slot) => {
                  const pendingCount = slot.requests?.filter((r) => r.status === 'PENDING').length || 0;
                  return (
                    <div key={slot.id} className="rounded-lg border border-border p-3">
                      <p className="font-medium text-sm">{slot.className || '전체 수업'}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {slot.startTime} ~ {slot.endTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={11} /> {slot.currentCount}/{slot.maxStudents}명
                        </span>
                      </div>
                      {pendingCount > 0 && (
                        <Badge variant="outline" className="mt-2 bg-yellow-100 text-yellow-700 text-[10px]">
                          대기 {pendingCount}건
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary */}
      {Object.keys(slotsByDate).length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          이번 달 보강 일정이 없습니다.
        </p>
      )}
    </div>
  );
}
