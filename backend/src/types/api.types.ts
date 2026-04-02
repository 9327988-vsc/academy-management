// 공통 응답 타입
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

// 날짜 필터
export interface DateFilter {
  startDate?: Date;
  endDate?: Date;
  date?: Date;
  month?: string; // YYYY-MM
  year?: number;
}

// 검색 파라미터
export interface SearchParams {
  query?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Teacher 관련
export interface TeacherWithStats {
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
  totalStudents: number;
  totalClasses: number;
  classes: any[];
  upcomingConsultations: any[];
  recentSalary?: any;
}

// Student 관련
export interface StudentWithDetails {
  id: number;
  userId?: number;
  name: string;
  phone: string;
  grade?: string;
  school?: string;
  status: string;
  parent?: {
    id: number;
    name: string;
    phone: string;
  };
  enrollments: any[];
  attendances: any[];
  payments: any[];
  attendanceRate: number;
}

// Class 관련
export interface ClassWithDetails {
  id: number;
  name: string;
  subject: string;
  teacher: {
    id: number;
    name: string;
  };
  schedule: string;
  startDate: Date;
  endDate: Date;
  room?: string;
  capacity: number;
  currentStudents: number;
  tuitionFee: number;
  status: string;
  enrollments?: any[];
}

// Enrollment 관련
export interface EnrollmentWithDetails {
  id: number;
  student: {
    id: number;
    name: string;
    grade?: string;
  };
  class: {
    id: number;
    name: string;
    subject: string;
  };
  enrollmentDate: Date;
  status: string;
  tuitionFee: number;
  discount: number;
  finalFee: number;
}

// Attendance 통계
export interface AttendanceStats {
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}

// Payment 통계
export interface PaymentStats {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  paymentRate: number;
}
