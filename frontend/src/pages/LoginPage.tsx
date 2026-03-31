import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { loginApi } from '@/api/auth.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TEST_ACCOUNTS = [
  { email: 'admin@academy.com', password: 'admin1234', label: '관리자', role: 'ADMIN' },
  { email: 'teacher@academy.com', password: 'test1234', label: '선생님', role: 'TEACHER' },
  { email: 'parent@test.com', password: 'parent1234', label: '학부모', role: 'PARENT' },
  { email: 'student@test.com', password: 'student1234', label: '학생', role: 'STUDENT' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const doLogin = async (loginEmail: string, loginPassword: string) => {
    setError('');
    setLoading(true);

    try {
      console.log('[Login] 시도:', loginEmail);
      const res = await loginApi(loginEmail, loginPassword);
      console.log('[Login] 응답:', res);

      if (res.success) {
        setAuth(res.user, res.accessToken, res.refreshToken);
        const dest = res.user.role === 'PARENT' ? '/parent/dashboard'
          : res.user.role === 'STUDENT' ? '/student/dashboard'
          : '/dashboard';
        navigate(dest);
      } else {
        setError(res.message || '로그인에 실패했습니다.');
      }
    } catch (err: unknown) {
      console.error('[Login] 에러:', err);
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin(email, password);
  };

  const handleQuickLogin = async (account: typeof TEST_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    await doLogin(account.email, account.password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            A
          </div>
          <h1 className="text-2xl font-bold tracking-tight">학원 관리 시스템</h1>
          <p className="mt-1 text-sm text-muted-foreground">계정으로 로그인하세요</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold text-muted-foreground">빠른 로그인</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-2">
              {TEST_ACCOUNTS.map((account) => (
                <Button
                  key={account.email}
                  variant="outline"
                  onClick={() => handleQuickLogin(account)}
                  disabled={loading}
                  className="h-auto py-3 flex flex-col items-center gap-1 hover:bg-accent"
                >
                  <span className="font-semibold text-sm">{account.label}</span>
                  <span className="text-[10px] text-muted-foreground">{account.email}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">또는 직접 입력</span>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@academy.com"
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '로그인 중...' : '로그인'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          계정이 없으신가요?{' '}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
