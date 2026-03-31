// ============================================
// 공통 응답 타입
// ============================================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// User & Auth
// ============================================
export type Role = 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  token: string;
  user: User & {
    profile?: Teacher | Student | Parent;
  };
}

// ============================================
// Teacher
// ============================================
export interface Teacher {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone: string;
  education?: string;
  career?: string;
  subjects: string[];
  introduction?: string;
  photoUrl?: string;
  employmentType: string;
  hourlyRate?: number;
  salary?: number;
  totalStudents: number;
  totalClasses: number;
  hireDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherWithDetails extends Teacher {
  classes: Class[];
  upcomingConsultations: Consultation[];
  recentSalary?: SalaryRecord;
}

// ============================================
// Student
// ============================================
export type StudentStatus = 'ACTIVE' | 'WITHDRAWN' | 'SUSPENDED' | 'GRADUATED';

export interface Student {
  id: number;
  userId?: number;
  name: string;
  phone: string;
  grade?: string;
  school?: string;
  birthDate?: string;
  address?: string;
  parentId?: number;
  registrationDate: string;
  status: StudentStatus;
  totalEnrollments: number;
  attendanceRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentWithDetails extends Student {
  parent?: Parent;
  enrollments: Enrollment[];
  attendances: Attendance[];
  payments: Payment[];
  grades?: Grade[];
  consultations?: Consultation[];
}

// ============================================
// Parent
// ============================================
export interface Parent {
  id: number;
  userId?: number;
  name: string;
  phone: string;
  email?: string;
  relation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParentWithChildren extends Parent {
  students: StudentWithDetails[];
}

// ============================================
// Class
// ============================================
export type ClassStatus = 'ACTIVE' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface Class {
  id: number;
  name: string;
  subject: string;
  description?: string;
  teacherId: number;
  schedule: string;
  startDate: string;
  endDate: string;
  room?: string;
  capacity: number;
  tuitionFee: number;
  status: ClassStatus;
  currentStudents: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClassWithDetails extends Class {
  teacher: {
    id: number;
    name: string;
  };
  enrollments: Enrollment[];
}

// ============================================
// Enrollment
// ============================================
export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'WITHDRAWN' | 'SUSPENDED';

export interface Enrollment {
  id: number;
  studentId: number;
  classId: number;
  enrollmentDate: string;
  status: EnrollmentStatus;
  tuitionFee: number;
  discount: number;
  finalFee: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentWithDetails extends Enrollment {
  student: Pick<Student, 'id' | 'name' | 'grade'>;
  class: Pick<Class, 'id' | 'name' | 'subject'>;
}

// ============================================
// Attendance
// ============================================
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface Attendance {
  id: number;
  studentId: number;
  classId: number;
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  note?: string;
  recordedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceStats {
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}

// ============================================
// Payment
// ============================================
export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Payment {
  id: number;
  studentId: number;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: PaymentStatus;
  month: string;
  description?: string;
  method?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentStats {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  paymentRate: number;
}

// ============================================
// Consultation
// ============================================
export type ConsultationType = 'INITIAL' | 'REGULAR' | 'EMERGENCY' | 'PARENT';
export type ConsultationStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Consultation {
  id: number;
  studentId: number;
  teacherId: number;
  scheduledDate: string;
  actualDate?: string;
  duration?: number;
  type: ConsultationType;
  status: ConsultationStatus;
  topic?: string;
  content?: string;
  outcome?: string;
  attendees?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Homework
// ============================================
export type HomeworkStatus = 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED';

export interface ClassHomework {
  id: number;
  classId: number;
  title: string;
  description: string;
  dueDate: string;
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Homework {
  id: number;
  classHomeworkId: number;
  studentId: number;
  status: HomeworkStatus;
  submittedDate?: string;
  content?: string;
  fileUrl?: string;
  grade?: string;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Grade
// ============================================
export interface Grade {
  id: number;
  studentId: number;
  examName: string;
  examDate: string;
  subject: string;
  score: number;
  maxScore: number;
  percentage: number;
  rank?: number;
  grade?: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Schedule
// ============================================
export type ScheduleType = 'CLASS' | 'MEETING' | 'CONSULTATION' | 'BREAK' | 'OTHER';
export type ClassScheduleStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';

export interface TeacherSchedule {
  id: number;
  teacherId: number;
  date: string;
  startTime: string;
  endTime: string;
  type: ScheduleType;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassSchedule {
  id: number;
  classId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: ClassScheduleStatus;
  originalDate?: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Salary
// ============================================
export type SalaryStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export interface SalaryRecord {
  id: number;
  teacherId: number;
  month: string;
  workHours: number;
  hourlyRate?: number;
  baseSalary: number;
  bonus: number;
  deduction: number;
  totalSalary: number;
  paymentDate?: string;
  status: SalaryStatus;
  detail?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Dashboard
// ============================================
export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  activeEnrollments: number;
  monthlyRevenue: number;
  attendanceRate: number;
  paymentRate: number;
}
