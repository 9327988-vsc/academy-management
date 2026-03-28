export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface Class {
  id: string;
  name: string;
  subject: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
  maxStudents: number;
  studentCount: number;
  createdAt: string;
}

export interface Parent {
  id: string;
  name: string;
  phone: string;
  relationship: string | null;
}

export interface Student {
  id: string;
  name: string;
  phone: string | null;
  grade: string | null;
  school: string | null;
  enrolledAt?: string;
  parents: Parent[];
}

export interface ClassSession {
  id: string;
  classId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  topic: string | null;
  textbook: string | null;
  pages: string | null;
  keyConcepts: string | null;
  homework: string | null;
  homeworkDueDate: string | null;
  nextTopic: string | null;
  specialNotes: string | null;
  notificationSent: boolean;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  status: 'present' | 'absent' | 'late';
  checkTime: string;
  notes: string | null;
}

export interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  total: number;
}

export interface NotificationRecipient {
  type: 'student' | 'parent';
  name: string;
  phone: string;
}

export interface NotificationPreviewItem {
  studentId: string;
  studentName: string;
  message: string;
  recipients: NotificationRecipient[];
}

export interface DashboardStats {
  todayClasses: number;
  totalStudents: number;
  totalClasses: number;
  todayClassList: { id: string; name: string; startTime: string; endTime: string }[];
  recentSessions: {
    id: string;
    classId: string;
    className: string;
    sessionDate: string;
    notificationSent: boolean;
  }[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: { field: string; message: string }[];
}
