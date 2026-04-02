import prisma from '../utils/prisma';

// Notification 모델이 v2 스키마에서 제거됨
// 향후 알림 시스템 재구축 시 사용할 스텁

export async function previewNotification(_classId: number, _teacherId: number) {
  return { presentStudents: [], absentStudents: [], totalRecipients: 0 };
}

export async function sendNotification(_classId: number, _teacherId: number) {
  return { total: 0, sent: 0, failed: 0, details: [] };
}

export async function getNotifications(_query: {
  teacherId: number;
  classId?: number;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return { notifications: [], total: 0 };
}
