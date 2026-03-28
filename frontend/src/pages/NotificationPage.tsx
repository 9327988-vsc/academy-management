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

  if (loading) return <div className="space-y-4"><Skeleton className="h-48 rounded-lg" /><Skeleton className="h-48 rounded-lg" /></div>;

  if (sent && sendResult) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">알림 발송 완료</h1>
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <p className="text-4xl">&#10003;</p>
            <p className="text-lg font-medium">알림이 발송되었습니다</p>
            <div className="flex justify-center gap-6 text-sm">
              <span>총 발송: <strong>{sendResult.total}건</strong></span>
              <span className="text-green-600">성공: <strong>{sendResult.sent}건</strong></span>
              <span className="text-red-600">실패: <strong>{sendResult.failed}건</strong></span>
            </div>
            <div className="pt-4">
              <Link to="/dashboard"><Button>대시보드로 돌아가기</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/classes/${classId}/attendance`}><Button variant="ghost" size="sm">&larr; 뒤로</Button></Link>
        <h1 className="text-2xl font-bold">알림 미리보기</h1>
      </div>

      {/* 출석 학생 알림 */}
      {presentStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">출석 학생 ({presentStudents.length}명)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {presentStudents.map((s) => (
              <div key={s.studentId} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{s.studentName}</span>
                  <div className="flex gap-1">
                    {s.recipients.map((r, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {r.name} ({r.type === 'parent' ? '학부모' : '학생'})
                      </Badge>
                    ))}
                  </div>
                </div>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted rounded p-3">
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
            <CardTitle className="text-lg text-destructive">결석 학생 ({absentStudents.length}명)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {absentStudents.map((s) => (
              <div key={s.studentId} className="rounded-lg border border-red-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{s.studentName}</span>
                  <div className="flex gap-1">
                    {s.recipients.map((r, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {r.name} ({r.type === 'parent' ? '학부모' : '학생'})
                      </Badge>
                    ))}
                  </div>
                </div>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-red-50 rounded p-3">
                  {s.message}
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 발송 요약 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              발송 대상: 총 <strong>{totalRecipients}건</strong> (SMS 문자 메시지)
            </p>
            <div className="flex gap-4">
              <Link to={`/classes/${classId}/attendance`}><Button variant="outline">취소</Button></Link>
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
