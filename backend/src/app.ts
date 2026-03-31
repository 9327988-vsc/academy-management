import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import classRoutes from './routes/class.routes';
import studentRoutes from './routes/student.routes';
import sessionRoutes from './routes/session.routes';
import attendanceRoutes from './routes/attendance.routes';
import notificationRoutes from './routes/notification.routes';
import dashboardRoutes from './routes/dashboard.routes';
import parentRoutes from './routes/parent.routes';
import studentPortalRoutes from './routes/studentPortal.routes';
import adminRoutes from './routes/admin.routes';
import settingsRoutes from './routes/settings.routes';
import announcementRoutes from './routes/announcement.routes';
import systemLogRoutes from './routes/systemLog.routes';
import paymentRoutes from './routes/payment.routes';

dotenv.config();

const app = express();

// Railway/Vercel 등 리버스 프록시 환경 설정
app.set('trust proxy', 1);

// 기본 미들웨어
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});
app.use('/api', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: '인증 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});
app.use('/api/auth', authLimiter);

// 라우트
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/student-portal', studentPortalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin/announcements', announcementRoutes);
app.use('/api/admin/logs', systemLogRoutes);
app.use('/api/admin/payments', paymentRoutes);

// 학부모 삭제 (별도 경로)
import { authenticate } from './middleware/auth.middleware';
import { deleteParent } from './controllers/student.controller';
app.delete('/api/parents/:id', authenticate, deleteParent as any);

// 헬스체크
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'ASMS API is running' });
});

// 에러 핸들러
app.use(errorHandler);

export default app;
