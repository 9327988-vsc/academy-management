import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { previewNotificationApi, sendNotificationApi } from '@/api/session.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { NotificationPreviewItem } from '@/types';

export default function NotificationPage() {
  const { id: classId, sid: sessionId } = useParams<{ id: string; sid: string }>();
  const [presentStudents, setPresentStudents] = useState<NotificationPreviewItem[]>([]);
  const [absentStudents, setAbsentStudents] = useState<NotificationPreviewItem[]>([]);
  const [totalRecipients, setTotalRecipients] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendResult, setSendResult] = useState<{ total: number; sent: number; failed: number } | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    previewNotificationApi(sessionId)
      .then((res) => {
        if (res.success) {
          setPresentStudents(res.data.presentStudents);
          setAbsentStudents(res.data.absentStudents);
          setTotalRecipients(res.data.totalRecipients);
        }
      })
      .catch(() => { toast.error('알림 미리보기를 불러올 수 없습니다.'); })
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleSend = async () => {
    if (!sessionId) return;
    setSending(true);
    try {
      const res = await sendNotificationApi(sessionId);
      if (res.success) {
        setSendResult(res.data);
        setSent(true);
      }
    } catch {
      toast.error('알림 발송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-36" />
        </div>
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
    );
  }

  if (sent && sendResult) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">알림 발송 완료</h1>
        <p className="mt-2 text-sm text-muted-foreground">학부모에게 수업 결과가 전달되었습니다.</p>
        <div className="mt-6 flex gap-6 rounded-lg border border-border px-6 py-3">
          <div className="text-center">
            <p className="text-2xl font-bold">{sendResult.total}</p>
            <p className="text-xs text-muted-foreground">총 발송</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{sendResult.sent}</p>
            <p className="text-xs text-muted-foreground">성공</p>
          </div>
          {sendResult.failed > 0 && (
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{sendResult.failed}</p>
              <p className="text-xs text-muted-foreground">실패</p>
            </div>
          )}
        </div>
        <Button asChild className="mt-8">
          <Link to="/dashboard">대시보드로 돌아가기</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link to={`/classes/${classId}/attendance`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">알림 미리보기</h1>
          <p className="text-sm text-muted-foreground">발송 전 메시지 내용을 확인하세요.</p>
        </div>
      </div>

      {/* 출석 학생 알림 */}
      {presentStudents.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <CardTitle className="text-base">출석 학생 ({presentStudents.length}명)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {presentStudents.map((s) => (
              <div key={s.studentId} className="rounded-lg border border-border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">{s.studentName}</span>
                  <div className="flex gap-1">
                    {s.recipients.map((r, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {r.name} ({r.type === 'parent' ? '학부모' : '학생'})
                      </Badge>
                    ))}
                  </div>
                </div>
                <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
                  {s.message}
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 결석 학생 알림 */}
      {absentStudents.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </div>
              <CardTitle className="text-base text-destructive">결석 학생 ({absentStudents.length}명)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {absentStudents.map((s) => (
              <div key={s.studentId} className="rounded-lg border border-red-200 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">{s.studentName}</span>
                  <div className="flex gap-1">
                    {s.recipients.map((r, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {r.name} ({r.type === 'parent' ? '학부모' : '학생'})
                      </Badge>
                    ))}
                  </div>
                </div>
                <pre className="whitespace-pre-wrap rounded-md bg-red-50 p-3 text-xs leading-relaxed text-muted-foreground">
                  {s.message}
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 발송 요약 — sticky footer */}
      <Card className="sticky bottom-4">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              총 <span className="font-semibold text-foreground">{totalRecipients}건</span> SMS 발송 예정
            </p>
            <div className="flex gap-2">
              <Button asChild variant="ghost"><Link to={`/classes/${classId}/attendance`}>취소</Link></Button>
              <Button onClick={handleSend} disabled={sending}>
                {sending ? '발송 중...' : '알림 발송하기'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
