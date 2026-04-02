import { PrismaClient, Prisma } from '@prisma/client';
import {
  TeacherWithStats,
  DateFilter,
  SearchParams,
  PaginatedResponse,
} from '../types/api.types';
import {
  calculatePagination,
  buildDateFilter,
  buildSearchFilter,
} from '../utils/query.utils';

const prisma = new PrismaClient();

// 강사 목록 조회
export async function getTeachers(params: SearchParams = {}) {
  const { page = 1, pageSize = 20, query, sortBy = 'name', sortOrder = 'asc' } = params;
  const { skip, take } = calculatePagination(page, pageSize);

  const where: Prisma.TeacherWhereInput = {
    ...buildSearchFilter(['name', 'email', 'education', 'career'], query),
  };

  const [teachers, total] = await Promise.all([
    prisma.teacher.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: true,
        classes: {
          where: { status: 'ACTIVE' },
          include: {
            enrollments: { where: { status: 'ACTIVE' } },
          },
        },
      },
    }),
    prisma.teacher.count({ where }),
  ]);

  const result: PaginatedResponse<TeacherWithStats> = {
    items: teachers.map(t => ({
      id: t.id,
      userId: t.userId,
      name: t.user.name,
      email: t.email,
      phone: t.phone,
      education: t.education || undefined,
      career: t.career || undefined,
      subjects: (t.subjects as string[]) || [],
      introduction: t.introduction || undefined,
      photoUrl: t.photoUrl || undefined,
      totalStudents: t.classes.reduce((sum, c) => sum + c.enrollments.length, 0),
      totalClasses: t.classes.length,
      classes: t.classes,
      upcomingConsultations: [],
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };

  return result;
}

// 강사 상세 조회
export async function getTeacherById(id: number): Promise<TeacherWithStats | null> {
  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      user: true,
      classes: {
        include: {
          enrollments: {
            where: { status: 'ACTIVE' },
            include: { student: true },
          },
        },
      },
      consultations: {
        where: { status: 'SCHEDULED' },
        orderBy: { scheduledDate: 'asc' },
        take: 5,
        include: { student: true },
      },
      salaryRecords: {
        orderBy: { month: 'desc' },
        take: 1,
      },
    },
  });

  if (!teacher) return null;

  return {
    id: teacher.id,
    userId: teacher.userId,
    name: teacher.user.name,
    email: teacher.email,
    phone: teacher.phone,
    education: teacher.education || undefined,
    career: teacher.career || undefined,
    subjects: (teacher.subjects as string[]) || [],
    introduction: teacher.introduction || undefined,
    photoUrl: teacher.photoUrl || undefined,
    totalStudents: teacher.classes.reduce((sum, c) => sum + c.enrollments.length, 0),
    totalClasses: teacher.classes.length,
    classes: teacher.classes,
    upcomingConsultations: teacher.consultations,
    recentSalary: teacher.salaryRecords[0],
  };
}

// 강사 생성
export async function createTeacher(data: {
  userId: number;
  phone: string;
  email: string;
  education?: string;
  career?: string;
  subjects?: string[];
  introduction?: string;
  employmentType?: string;
  hourlyRate?: number;
  salary?: number;
}) {
  return await prisma.teacher.create({
    data: {
      ...data,
      subjects: data.subjects || [],
    },
    include: { user: true },
  });
}

// 강사 수정
export async function updateTeacher(
  id: number,
  data: Partial<{
    phone: string;
    email: string;
    education: string;
    career: string;
    subjects: string[];
    introduction: string;
    photoUrl: string;
    employmentType: string;
    hourlyRate: number;
    salary: number;
  }>
) {
  return await prisma.teacher.update({
    where: { id },
    data,
    include: { user: true },
  });
}

// 강사 삭제
export async function deleteTeacher(id: number) {
  return await prisma.teacher.delete({ where: { id } });
}

// 강사별 학생 목록
export async function getTeacherStudents(teacherId: number, params: SearchParams = {}) {
  const { page = 1, pageSize = 50, query } = params;
  const { skip, take } = calculatePagination(page, pageSize);

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: {
      classes: {
        include: {
          enrollments: {
            where: {
              status: 'ACTIVE',
              ...(query && {
                student: {
                  OR: [
                    { name: { contains: query } },
                    { phone: { contains: query } },
                  ],
                },
              }),
            },
            skip,
            take,
            include: {
              student: {
                include: {
                  parent: true,
                  attendances: {
                    orderBy: { date: 'desc' },
                    take: 10,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!teacher) return null;

  const students = teacher.classes.flatMap(c => c.enrollments.map(e => e.student));

  return {
    students: Array.from(new Map(students.map(s => [s.id, s])).values()),
    total: students.length,
  };
}

// 강사별 일정 조회
export async function getTeacherSchedule(teacherId: number, filter: DateFilter = {}) {
  const dateFilter = buildDateFilter(filter);

  return await prisma.teacherSchedule.findMany({
    where: {
      teacherId,
      ...(dateFilter && { date: dateFilter }),
    },
    orderBy: { date: 'asc' },
  });
}

// 강사별 급여 내역
export async function getTeacherSalaries(teacherId: number, params: { year?: number } = {}) {
  const where: Prisma.SalaryRecordWhereInput = {
    teacherId,
    ...(params.year && { month: { startsWith: String(params.year) } }),
  };

  return await prisma.salaryRecord.findMany({
    where,
    orderBy: { month: 'desc' },
  });
}
