import prisma from '../utils/prisma';
import bcrypt from 'bcrypt';

interface CreateUserWithDataInput {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: string;
  grade?: string;
  school?: string;
  parentPhone?: string;
}

export async function createUserWithData(input: CreateUserWithDataInput) {
  const { email, password, name, phone, role, grade, school, parentPhone } = input;

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      phone,
      role: role as any,
    },
  });

  let additionalData: any = null;
  let warning: string | undefined;

  if (role === 'STUDENT') {
    let parentId: number | null = null;
    if (parentPhone) {
      const parent = await prisma.parent.findUnique({
        where: { phone: parentPhone },
      });
      if (parent) {
        parentId = parent.id;
      }
    }

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        name,
        phone,
        grade: grade || '',
        school: school || '',
        parentId,
      },
    });
    additionalData = student;

    if (parentPhone && !parentId) {
      warning = `전화번호 ${parentPhone}로 등록된 부모를 찾을 수 없습니다. 나중에 연결해주세요.`;
    }
  }

  if (role === 'TEACHER') {
    const teacher = await prisma.teacher.create({
      data: {
        userId: user.id,
        phone,
        email,
      },
    });
    additionalData = teacher;
  }

  if (role === 'PARENT') {
    const parent = await prisma.parent.create({
      data: {
        userId: user.id,
        name,
        phone,
      },
    });
    additionalData = parent;
  }

  return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, additionalData, warning };
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return users;
}

export async function updateUserRole(userId: number, role: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: role as any },
    select: { id: true, name: true, email: true, role: true },
  });
  return user;
}

export async function deleteUser(userId: number) {
  await prisma.user.delete({ where: { id: userId } });
}

// --- Dev Mode: 첫 번째 학생/부모 데이터로 대시보드 반환 ---

export async function getDevStudentDashboard() {
  const student = await prisma.student.findFirst({
    where: { attendances: { some: {} } },
    include: {
      enrollments: {
        where: { status: 'ACTIVE' },
        include: {
          class: { select: { id: true, name: true, subject: true, schedule: true, room: true } },
        },
      },
      attendances: {
        orderBy: { date: 'desc' },
        take: 30,
        include: {
          class: { select: { name: true } },
        },
      },
    },
  });

  if (!student) {
    const anyStudent = await prisma.student.findFirst({
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            class: { select: { id: true, name: true, subject: true, schedule: true, room: true } },
          },
        },
      },
    });
    if (!anyStudent) return null;

    return {
      name: anyStudent.name,
      grade: anyStudent.grade,
      school: anyStudent.school,
      attendanceRate: 0,
      stats: { total: 0, present: 0, late: 0, absent: 0 },
      classes: anyStudent.enrollments.map((e) => ({
        id: e.class.id, name: e.class.name, subject: e.class.subject,
        schedule: e.class.schedule, room: e.class.room,
      })),
      recentAttendance: [],
    };
  }

  const totalAttendance = student.attendances.length;
  const presentCount = student.attendances.filter((a) => a.status === 'PRESENT').length;
  const lateCount = student.attendances.filter((a) => a.status === 'LATE').length;
  const absentCount = student.attendances.filter((a) => a.status === 'ABSENT').length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  return {
    name: student.name,
    grade: student.grade,
    school: student.school,
    attendanceRate,
    stats: { total: totalAttendance, present: presentCount, late: lateCount, absent: absentCount },
    classes: student.enrollments.map((e) => ({
      id: e.class.id, name: e.class.name, subject: e.class.subject,
      schedule: e.class.schedule, room: e.class.room,
    })),
    recentAttendance: student.attendances.slice(0, 15).map((a) => ({
      date: a.date,
      className: a.class.name,
      status: a.status,
    })),
  };
}

export async function getDevParentChildren() {
  const student = await prisma.student.findFirst({
    where: { attendances: { some: {} } },
    include: { parent: true },
  });

  if (!student) {
    const anyStudent = await prisma.student.findFirst({
      include: { parent: true },
    });
    if (!anyStudent || !anyStudent.parent) return [];
    return getChildrenByParentId(anyStudent.parent.id);
  }

  if (!student.parent) return [];
  return getChildrenByParentId(student.parent.id);
}

async function getChildrenByParentId(parentId: number) {
  const children = await prisma.student.findMany({
    where: { parentId },
    include: {
      enrollments: {
        where: { status: 'ACTIVE' },
        include: {
          class: { select: { id: true, name: true, subject: true, schedule: true } },
        },
      },
      attendances: {
        orderBy: { date: 'desc' },
        take: 20,
        include: {
          class: { select: { name: true } },
        },
      },
    },
  });

  return children.map((s) => {
    const totalAttendance = s.attendances.length;
    const presentCount = s.attendances.filter((a) => a.status === 'PRESENT').length;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    return {
      id: s.id, name: s.name, grade: s.grade, school: s.school, phone: s.phone,
      attendanceRate, totalClasses: totalAttendance,
      classes: s.enrollments.map((e) => ({
        id: e.class.id, name: e.class.name, subject: e.class.subject,
        schedule: e.class.schedule,
      })),
      recentAttendance: s.attendances.slice(0, 10).map((a) => ({
        date: a.date,
        className: a.class.name,
        status: a.status,
      })),
    };
  });
}

export async function getSystemStats() {
  const [userCount, classCount, studentCount, enrollmentCount] = await Promise.all([
    prisma.user.count(),
    prisma.class.count(),
    prisma.student.count(),
    prisma.enrollment.count(),
  ]);

  const usersByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: true,
  });

  return {
    users: userCount,
    classes: classCount,
    students: studentCount,
    enrollments: enrollmentCount,
    usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count })),
  };
}
