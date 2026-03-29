import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { getSettingsApi, updateSettingsApi, getAdminStatsApi } from '@/api/admin.api';
import { toast } from 'sonner';
import { Settings, Users, BookOpen, GraduationCap, BarChart3 } from 'lucide-react';

interface AcademySettings {
  id?: number;
  academyName: string;
  ownerName: string;
  phone: string;
  address: string;
  businessNumber: string;
}

interface SystemStats {
  users: number;
  classes: number;
  students: number;
  sessions: number;
  usersByRole: { role: string; count: number }[];
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AcademySettings>({
    academyName: '', ownerName: '', phone: '', address: '', businessNumber: '',
  });
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      getSettingsApi().then((res) => {
        if (res.success && res.data) {
          setSettings({
            id: res.data.id,
            academyName: res.data.academyName || '',
            ownerName: res.data.ownerName || '',
            phone: res.data.phone || '',
            address: res.data.address || '',
            businessNumber: res.data.businessNumber || '',
          });
        }
      }),
      getAdminStatsApi().then((res) => { if (res.success) setStats(res.data); }),
    ])
      .catch(() => toast.error('설정을 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettingsApi(settings);
      toast.success('설정이 저장되었습니다.');
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
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
    { label: '사용자', value: stats.users, icon: Users, accent: 'bg-blue-50 text-blue-600' },
    { label: '수업', value: stats.classes, icon: BookOpen, accent: 'bg-green-50 text-green-600' },
    { label: '학생', value: stats.students, icon: GraduationCap, accent: 'bg-violet-50 text-violet-600' },
    { label: '수업 기록', value: stats.sessions, icon: BarChart3, accent: 'bg-amber-50 text-amber-600' },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings size={22} />
          학원 설정
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">학원 기본 정보와 시스템 통계를 확인합니다.</p>
      </div>

      {/* 시스템 통계 */}
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
                  <p className="text-xl font-bold">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">기본 정보</TabsTrigger>
          <TabsTrigger value="system">시스템 정보</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">학원 기본 정보</CardTitle>
              <CardDescription>학원의 기본 정보를 관리합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="academyName">학원명</Label>
                  <Input
                    id="academyName"
                    placeholder="○○학원"
                    value={settings.academyName}
                    onChange={(e) => setSettings({ ...settings, academyName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerName">원장 이름</Label>
                  <Input
                    id="ownerName"
                    placeholder="홍길동"
                    value={settings.ownerName}
                    onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">전화번호</Label>
                  <Input
                    id="phone"
                    placeholder="02-1234-5678"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessNumber">사업자등록번호</Label>
                  <Input
                    id="businessNumber"
                    placeholder="123-45-67890"
                    value={settings.businessNumber}
                    onChange={(e) => setSettings({ ...settings, businessNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">주소</Label>
                <Input
                  id="address"
                  placeholder="서울시 ..."
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">역할별 사용자 현황</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.usersByRole && (
                <div className="space-y-3">
                  {stats.usersByRole.map(({ role, count }) => (
                    <div key={role} className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm font-medium capitalize">{role}</span>
                      <span className="text-sm text-muted-foreground">{count}명</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
