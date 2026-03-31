import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoleGuard from '@/components/auth/RoleGuard';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import DashboardPage from '@/pages/DashboardPage';
import ClassListPage from '@/pages/ClassListPage';
import ClassDetailPage from '@/pages/ClassDetailPage';
import StudentManagePage from '@/pages/StudentManagePage';
import AttendancePage from '@/pages/AttendancePage';
import NotificationPage from '@/pages/NotificationPage';
import ParentDashboard from '@/pages/parent/ParentDashboard';
import StudentDashboard from '@/pages/student/StudentDashboard';
import SettingsPage from '@/pages/admin/SettingsPage';
import UsersPage from '@/pages/admin/UsersPage';
import PaymentsPage from '@/pages/admin/PaymentsPage';
import AnnouncementsPage from '@/pages/admin/AnnouncementsPage';
import SystemLogsPage from '@/pages/admin/SystemLogsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* 공개 라우트 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* 인증 필요 라우트 */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* 선생님/관리자 라우트 */}
              <Route element={<RoleGuard allowedRoles={['TEACHER', 'ADMIN']} />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/classes" element={<ClassListPage />} />
                <Route path="/classes/:id" element={<ClassDetailPage />} />
                <Route path="/classes/:id/students" element={<StudentManagePage />} />
                <Route path="/classes/:id/attendance" element={<AttendancePage />} />
                <Route path="/classes/:id/sessions/:sid/notify" element={<NotificationPage />} />
              </Route>

              {/* 관리자 전용 */}
              <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
                <Route path="/admin/settings" element={<SettingsPage />} />
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/payments" element={<PaymentsPage />} />
                <Route path="/admin/announcements" element={<AnnouncementsPage />} />
                <Route path="/admin/logs" element={<SystemLogsPage />} />
              </Route>

              {/* 학부모 라우트 */}
              <Route element={<RoleGuard allowedRoles={['PARENT']} redirectTo="/login" />}>
                <Route path="/parent/dashboard" element={<ParentDashboard />} />
              </Route>

              {/* 학생 라우트 */}
              <Route element={<RoleGuard allowedRoles={['STUDENT']} redirectTo="/login" />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
              </Route>
            </Route>
          </Route>

          {/* 기본 리다이렉트 */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
    </ErrorBoundary>
  );
}
