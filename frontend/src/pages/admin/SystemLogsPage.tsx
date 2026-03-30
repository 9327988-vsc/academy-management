import { useCallback, useEffect, useState } from 'react';
import { getSystemLogsApi } from '@/api/admin.api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Activity, RefreshCw } from 'lucide-react';

interface LogItem {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  target: string | null;
  detail: string | null;
  createdAt: string;
}

const ACTION_COLOR: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700 border-green-200',
  UPDATE: 'bg-blue-100 text-blue-700 border-blue-200',
  DELETE: 'bg-red-100 text-red-700 border-red-200',
  LOGIN: 'bg-violet-100 text-violet-700 border-violet-200',
  LOGOUT: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 50;

  const fetchLogs = useCallback((offset = 0) => {
    setLoading(true);
    getSystemLogsApi(limit, offset)
      .then((res) => {
        if (res.success) {
          setLogs(res.data.logs);
          setTotal(res.data.total);
        }
      })
      .catch(() => toast.error('로그를 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  }, [limit]);

  useEffect(() => { fetchLogs(page * limit); }, [page, limit, fetchLogs]);

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity size={22} />
            시스템 로그
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">시스템 활동 내역을 확인합니다. (총 {total}건)</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchLogs(page * limit)} className="gap-1">
          <RefreshCw size={14} /> 새로고침
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">활동 로그</CardTitle>
          <CardDescription>
            {total > 0 ? `${page * limit + 1}-${Math.min((page + 1) * limit, total)} / ${total}건` : '기록 없음'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">시스템 로그가 없습니다.</p>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-3">
                  <div className="mt-0.5">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${ACTION_COLOR[log.action] || 'bg-gray-100 text-gray-700'}`}>
                      {log.action}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{log.userName || '시스템'}</p>
                      {log.target && (
                        <span className="text-xs text-muted-foreground truncate">{log.target}</span>
                      )}
                    </div>
                    {log.detail && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.detail}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('ko-KR')}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          {total > limit && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                이전
              </Button>
              <span className="text-sm text-muted-foreground">
                {page + 1} / {Math.ceil(total / limit)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={(page + 1) * limit >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
