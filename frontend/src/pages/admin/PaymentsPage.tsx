import { useEffect, useState } from 'react';
import { getPaymentsApi, updatePaymentStatusApi, deletePaymentApi, getPaymentStatsApi, createPaymentApi } from '@/api/admin.api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { CreditCard, TrendingUp, AlertTriangle, CheckCircle, Trash2, Plus } from 'lucide-react';

interface PaymentItem {
  id: string;
  studentId: string;
  amount: number;
  month: string;
  status: string;
  paidAt: string | null;
  description: string | null;
  createdAt: string;
  student: { id: string; name: string; grade: string | null };
}

interface PaymentStats {
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  overdueAmount: number;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  paid: { label: '납부', className: 'bg-green-100 text-green-700 border-green-200' },
  unpaid: { label: '미납', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  overdue: { label: '연체', className: 'bg-red-100 text-red-700 border-red-200' },
};

function formatAmount(amount: number) {
  return amount.toLocaleString('ko-KR') + '원';
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({ studentId: '', amount: '', month: '', description: '' });

  const fetchData = () => {
    const filters: { status?: string; month?: string } = {};
    if (statusFilter) filters.status = statusFilter;
    if (monthFilter) filters.month = monthFilter;

    Promise.all([
      getPaymentsApi(filters).then((res) => { if (res.success) setPayments(res.data); }),
      getPaymentStatsApi().then((res) => { if (res.success) setStats(res.data); }),
    ])
      .catch(() => toast.error('결제 데이터를 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [statusFilter, monthFilter]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updatePaymentStatusApi(id, status);
      toast.success('결제 상태가 변경되었습니다.');
      fetchData();
    } catch {
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePaymentApi(id);
      toast.success('결제 내역이 삭제되었습니다.');
      fetchData();
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  const handleCreate = async () => {
    if (!newPayment.studentId || !newPayment.amount || !newPayment.month) {
      toast.error('필수 항목을 입력해주세요.');
      return;
    }
    try {
      await createPaymentApi({
        studentId: newPayment.studentId,
        amount: parseInt(newPayment.amount),
        month: newPayment.month,
        description: newPayment.description || undefined,
      });
      toast.success('결제 내역이 추가되었습니다.');
      setCreateOpen(false);
      setNewPayment({ studentId: '', amount: '', month: '', description: '' });
      fetchData();
    } catch {
      toast.error('추가에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  const statCards = stats ? [
    { label: '총 수업료', value: formatAmount(stats.totalAmount), icon: CreditCard, accent: 'bg-blue-50 text-blue-600' },
    { label: '납부 완료', value: formatAmount(stats.paidAmount), icon: CheckCircle, accent: 'bg-green-50 text-green-600' },
    { label: '미납', value: formatAmount(stats.unpaidAmount), icon: TrendingUp, accent: 'bg-yellow-50 text-yellow-600' },
    { label: '연체', value: formatAmount(stats.overdueAmount), icon: AlertTriangle, accent: 'bg-red-50 text-red-600' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard size={22} />
            결제 관리
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">수업료 납부 현황을 관리합니다.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1">
          <Plus size={16} /> 결제 추가
        </Button>
      </div>

      {/* 통계 */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, accent }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-3 py-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="text-lg font-bold">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 필터 */}
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">전체 상태</option>
          <option value="paid">납부</option>
          <option value="unpaid">미납</option>
          <option value="overdue">연체</option>
        </select>
        <Input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="w-40"
          placeholder="월 선택"
        />
      </div>

      {/* 결제 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">결제 내역</CardTitle>
          <CardDescription>{payments.length}건</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">결제 내역이 없습니다.</p>
          ) : (
            <div className="divide-y divide-border">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {p.student.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{p.student.name}</p>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_BADGE[p.status]?.className || ''}`}>
                          {STATUS_BADGE[p.status]?.label || p.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.month} · {formatAmount(p.amount)}
                        {p.description && ` · ${p.description}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={p.status}
                      onChange={(e) => handleStatusChange(p.id, e.target.value)}
                      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                    >
                      <option value="unpaid">미납</option>
                      <option value="paid">납부</option>
                      <option value="overdue">연체</option>
                    </select>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                          <Trash2 size={14} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>결제 내역을 삭제하시겠습니까?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {p.student.name}의 {p.month} 결제 내역이 삭제됩니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(p.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            삭제
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 결제 추가 Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>결제 내역 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>학생 ID</Label>
              <Input
                placeholder="학생 ID 입력"
                value={newPayment.studentId}
                onChange={(e) => setNewPayment({ ...newPayment, studentId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>금액 (원)</Label>
              <Input
                type="number"
                placeholder="300000"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>월</Label>
              <Input
                type="month"
                value={newPayment.month}
                onChange={(e) => setNewPayment({ ...newPayment, month: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>설명 (선택)</Label>
              <Input
                placeholder="수학 수업료"
                value={newPayment.description}
                onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
              />
            </div>
            <Button onClick={handleCreate} className="w-full">추가</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
