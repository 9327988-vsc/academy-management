import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import DashboardPage from '@/pages/DashboardPage';
import ClassListPage from '@/pages/ClassListPage';
import ClassDetailPage from '@/pages/ClassDetailPage';
import StudentManagePage from '@/pages/StudentManagePage';
import AttendancePage from '@/pages/AttendancePage';
import NotificationPage from '@/pages/NotificationPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* 공개 라우트 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* 인증 필요 라우트 */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/classes" element={<ClassListPage />} />
              <Route path="/classes/:id" element={<ClassDetailPage />} />
              <Route path="/classes/:id/students" element={<StudentManagePage />} />
              <Route path="/classes/:id/attendance" element={<AttendancePage />} />
              <Route path="/classes/:id/sessions/:sid/notify" element={<NotificationPage />} />
            </Route>
          </Route>

          {/* 기본 리다이렉트 */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
