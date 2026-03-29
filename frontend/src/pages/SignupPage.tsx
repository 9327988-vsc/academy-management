import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerApi } from '@/api/auth.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerApi({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      if (res.success) {
        navigate('/login');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || '회원가입에 실패했습니다.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            A
          </div>
          <h1 className="text-2xl font-bold tracking-tight">선생님 회원가입</h1>
          <p className="mt-1 text-sm text-muted-foreground">계정을 만들고 학원 관리를 시작하세요</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="홍길동" autoComplete="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="teacher@academy.com" autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">전화번호</Label>
                <Input id="phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="010-0000-0000" autoComplete="tel" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input id="password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="8자 이상" autoComplete="new-password" required />
                <p className="text-xs text-muted-foreground">최소 8자, 영문 + 숫자 포함</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} placeholder="비밀번호 재입력" autoComplete="new-password" required />
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '가입 중...' : '회원가입'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  );
}
