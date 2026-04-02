import { PrismaClient, Prisma } from '@prisma/client';
import {
  EnrollmentWithDetails,
  SearchParams,
  PaginatedResponse,
} from '../types/api.types';
import { calculatePagination } from '../utils/query.utils';

const prisma = new PrismaClient();

// 수강 신청 목록
export async function getEnrollments(params: SearchParams = {}) {
  const { page = 1, pageSize = 50, sortBy = 'enrollmentDate', sortOrder = 'desc' } = params;
  const { skip, take } = calculatePagination(page, pageSize);

  const [enrollments, total] = await Promise.all([
    prisma.enrollment.findMany({
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        student: {
          include: { parent: true },
        },
        class: {
          include: {
            teacher: { include: { user: true } },
          },
        },
      },
    }),
    prisma.enrollment.count(),
  ]);

  const result: PaginatedResponse<EnrollmentWithDetails> = {
    items: enrollments.map(e => ({
      id: e.id,
      student: {
        id: e.student.id,
        name: e.student.name,
        grade: e.student.grade || undefined,
      },
      class: {
        id: e.class.id,
        name: e.class.name,
        subject: e.class.subject,
      },
      enrollmentDate: e.enrollmentDate,
      status: e.status,
      tuitionFee: e.tuitionFee,
      discount: e.discount,
      finalFee: e.finalFee,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };

  return result;
}

// 수강 신청 생성
export async function createEnrollment(data: {
  studentId: number;
  classId: number;
  tuitionFee: number;
  discount?: number;
  note?: string;
}) {
  const finalFee = data.tuitionFee - (data.discount || 0);

  return await prisma.enrollment.create({
    data: {
      studentId: data.studentId,
      classId: data.classId,
      tuitionFee: data.tuitionFee,
      discount: data.discount || 0,
      finalFee,
      note: data.note,
      status: 'ACTIVE',
    },
    include: {
      student: true,
      class: {
        include: {
          teacher: { include: { user: true } },
        },
      },
    },
  });
}

// 수강 신청 수정
export async function updateEnrollment(
  id: number,
  data: Partial<{
    status: string;
    tuitionFee: number;
    discount: number;
    note: string;
  }>
) {
  if (data.tuitionFee !== undefined || data.discount !== undefined) {
    const enrollment = await prisma.enrollment.findUnique({ where: { id } });
    if (enrollment) {
      const tuitionFee = data.tuitionFee ?? enrollment.tuitionFee;
      const discount = data.discount ?? enrollment.discount;
      (data as any).finalFee = tuitionFee - discount;
    }
  }

  return await prisma.enrollment.update({
    where: { id },
    data: data as any,
    include: {
      student: true,
      class: true,
    },
  });
}

// 수강 신청 삭제
export async function deleteEnrollment(id: number) {
  return await prisma.enrollment.delete({ where: { id } });
}

// 학생별 수강 내역
export async function getStudentEnrollments(studentId: number) {
  return await prisma.enrollment.findMany({
    where: { studentId },
    include: {
      class: {
        include: {
          teacher: { include: { user: true } },
        },
      },
    },
    orderBy: { enrollmentDate: 'desc' },
  });
}

// 수업별 수강생
export async function getClassEnrollments(classId: number) {
  return await prisma.enrollment.findMany({
    where: { classId },
    include: {
      student: {
        include: { parent: true },
      },
    },
    orderBy: { student: { name: 'asc' } },
  });
}
