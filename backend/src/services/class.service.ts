import { PrismaClient, Prisma } from '@prisma/client';
import {
  ClassWithDetails,
  SearchParams,
  PaginatedResponse,
} from '../types/api.types';
import {
  calculatePagination,
  buildSearchFilter,
} from '../utils/query.utils';

const prisma = new PrismaClient();

// 수업 목록 조회
export async function getClasses(params: SearchParams = {}) {
  const { page = 1, pageSize = 20, query, sortBy = 'name', sortOrder = 'asc' } = params;
  const { skip, take } = calculatePagination(page, pageSize);

  const where: Prisma.ClassWhereInput = {
    ...buildSearchFilter(['name', 'subject', 'room'], query),
  };

  const [classes, total] = await Promise.all([
    prisma.class.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        teacher: {
          include: { user: true },
        },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { student: true },
        },
      },
    }),
    prisma.class.count({ where }),
  ]);

  const result: PaginatedResponse<ClassWithDetails> = {
    items: classes.map(c => ({
      id: c.id,
      name: c.name,
      subject: c.subject,
      teacher: {
        id: c.teacher.id,
        name: c.teacher.user.name,
      },
      schedule: c.schedule,
      startDate: c.startDate,
      endDate: c.endDate,
      room: c.room || undefined,
      capacity: c.capacity,
      currentStudents: c.enrollments.length,
      tuitionFee: c.tuitionFee,
      status: c.status,
      enrollments: c.enrollments,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };

  return result;
}

// 수업 상세 조회
export async function getClassById(id: number): Promise<ClassWithDetails | null> {
  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      teacher: {
        include: { user: true },
      },
      enrollments: {
        include: {
          student: {
            include: { parent: true },
          },
        },
      },
      schedules: {
        orderBy: { date: 'asc' },
        take: 20,
      },
      attendances: {
        orderBy: { date: 'desc' },
        take: 50,
      },
    },
  });

  if (!cls) return null;

  return {
    id: cls.id,
    name: cls.name,
    subject: cls.subject,
    teacher: {
      id: cls.teacher.id,
      name: cls.teacher.user.name,
    },
    schedule: cls.schedule,
    startDate: cls.startDate,
    endDate: cls.endDate,
    room: cls.room || undefined,
    capacity: cls.capacity,
    currentStudents: cls.enrollments.filter(e => e.status === 'ACTIVE').length,
    tuitionFee: cls.tuitionFee,
    status: cls.status,
    enrollments: cls.enrollments,
  };
}

// 수업 생성
export async function createClass(data: {
  name: string;
  subject: string;
  description?: string;
  teacherId: number;
  schedule: string;
  startDate: Date;
  endDate: Date;
  room?: string;
  capacity?: number;
  tuitionFee: number;
}) {
  return await prisma.class.create({
    data,
    include: {
      teacher: { include: { user: true } },
    },
  });
}

// 수업 수정
export async function updateClass(
  id: number,
  data: Partial<{
    name: string;
    subject: string;
    description: string;
    teacherId: number;
    schedule: string;
    startDate: Date;
    endDate: Date;
    room: string;
    capacity: number;
    tuitionFee: number;
    status: string;
  }>
) {
  return await prisma.class.update({
    where: { id },
    data: data as any,
    include: {
      teacher: { include: { user: true } },
    },
  });
}

// 수업 삭제
export async function deleteClass(id: number) {
  return await prisma.class.delete({ where: { id } });
}

// 수업별 학생 목록
export async function getClassStudents(classId: number) {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId,
      status: 'ACTIVE',
    },
    include: {
      student: {
        include: {
          parent: true,
          attendances: {
            where: { classId },
            orderBy: { date: 'desc' },
            take: 10,
          },
        },
      },
    },
  });

  return enrollments.map(e => e.student);
}

// 수업별 출석 현황
export async function getClassAttendance(classId: number, date: Date) {
  return await prisma.attendance.findMany({
    where: {
      classId,
      date: {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999)),
      },
    },
    include: {
      student: true,
    },
    orderBy: { student: { name: 'asc' } },
  });
}
