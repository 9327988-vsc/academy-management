import { PrismaClient, Prisma } from '@prisma/client';
import {
  StudentWithDetails,
  SearchParams,
  PaginatedResponse,
  DateFilter,
  AttendanceStats,
  PaymentStats,
} from '../types/api.types';
import {
  calculatePagination,
  buildSearchFilter,
  buildDateFilter,
  calculateAttendanceRate,
  calculatePaymentRate,
} from '../utils/query.utils';

const prisma = new PrismaClient();

// 학생 목록 조회
export async function getStudents(params: SearchParams = {}) {
  const { page = 1, pageSize = 50, query, sortBy = 'name', sortOrder = 'asc' } = params;
  const { skip, take } = calculatePagination(page, pageSize);

  const where: Prisma.StudentWhereInput = {
    deletedAt: null,
    ...buildSearchFilter(['name', 'phone', 'school'], query),
  };

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: true,
        parent: true,
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            class: {
              include: { teacher: { include: { user: true } } },
            },
          },
        },
        attendances: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        payments: {
          where: { status: { in: ['PENDING', 'OVERDUE'] } },
        },
      },
    }),
    prisma.student.count({ where }),
  ]);

  const result: PaginatedResponse<StudentWithDetails> = {
    items: students.map(s => ({
      id: s.id,
      userId: s.userId || undefined,
      name: s.name,
      phone: s.phone,
      grade: s.grade || undefined,
      school: s.school || undefined,
      status: s.status,
      parent: s.parent ? {
        id: s.parent.id,
        name: s.parent.name,
        phone: s.parent.phone,
      } : undefined,
      enrollments: s.enrollments,
      attendances: s.attendances,
      payments: s.payments,
      attendanceRate: calculateAttendanceRate(s.attendances),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };

  return result;
}

// 학생 상세 조회
export async function getStudentById(id: number): Promise<StudentWithDetails | null> {
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      user: true,
      parent: true,
      enrollments: {
        include: {
          class: {
            include: {
              teacher: { include: { user: true } },
            },
          },
        },
      },
      attendances: {
        orderBy: { date: 'desc' },
        take: 30,
        include: { class: true },
      },
      payments: {
        orderBy: { dueDate: 'desc' },
        take: 12,
      },
      grades: {
        orderBy: { examDate: 'desc' },
        take: 10,
      },
      consultations: {
        orderBy: { scheduledDate: 'desc' },
        take: 5,
        include: { teacher: { include: { user: true } } },
      },
    },
  });

  if (!student) return null;

  return {
    id: student.id,
    userId: student.userId || undefined,
    name: student.name,
    phone: student.phone,
    grade: student.grade || undefined,
    school: student.school || undefined,
    status: student.status,
    parent: student.parent ? {
      id: student.parent.id,
      name: student.parent.name,
      phone: student.parent.phone,
    } : undefined,
    enrollments: student.enrollments,
    attendances: student.attendances,
    payments: student.payments,
    attendanceRate: calculateAttendanceRate(student.attendances),
  };
}

// 학생 생성
export async function createStudent(data: {
  userId?: number;
  name: string;
  phone: string;
  grade?: string;
  school?: string;
  birthDate?: Date;
  address?: string;
  parentId?: number;
}) {
  return await prisma.student.create({
    data,
    include: {
      user: true,
      parent: true,
    },
  });
}

// 학생 수정
export async function updateStudent(
  id: number,
  data: Partial<{
    name: string;
    phone: string;
    grade: string;
    school: string;
    birthDate: Date;
    address: string;
    parentId: number;
    status: string;
  }>
) {
  return await prisma.student.update({
    where: { id },
    data: data as any,
    include: {
      user: true,
      parent: true,
    },
  });
}

// 학생 삭제 (소프트 삭제)
export async function deleteStudent(id: number) {
  return await prisma.student.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

// 학생 출석 통계
export async function getStudentAttendanceStats(
  studentId: number,
  filter: DateFilter = {}
): Promise<AttendanceStats> {
  const dateFilter = buildDateFilter(filter);

  const attendances = await prisma.attendance.findMany({
    where: {
      studentId,
      ...(dateFilter && { date: dateFilter }),
    },
  });

  const stats = {
    totalClasses: attendances.length,
    present: attendances.filter(a => a.status === 'PRESENT').length,
    absent: attendances.filter(a => a.status === 'ABSENT').length,
    late: attendances.filter(a => a.status === 'LATE').length,
    excused: attendances.filter(a => a.status === 'EXCUSED').length,
    attendanceRate: calculateAttendanceRate(attendances),
  };

  return stats;
}

// 학생 결제 통계
export async function getStudentPaymentStats(
  studentId: number,
  filter: DateFilter = {}
): Promise<PaymentStats> {
  const dateFilter = buildDateFilter(filter);

  const payments = await prisma.payment.findMany({
    where: {
      studentId,
      ...(dateFilter && { dueDate: dateFilter }),
    },
  });

  const stats = {
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    paidAmount: payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0),
    pendingAmount: payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0),
    overdueAmount: payments.filter(p => p.status === 'OVERDUE').reduce((sum, p) => sum + p.amount, 0),
    paymentRate: calculatePaymentRate(payments),
  };

  return stats;
}

// 학생별 성적 조회
export async function getStudentGrades(studentId: number, params: { subject?: string } = {}) {
  return await prisma.grade.findMany({
    where: {
      studentId,
      ...(params.subject && { subject: params.subject }),
    },
    orderBy: { examDate: 'desc' },
  });
}
