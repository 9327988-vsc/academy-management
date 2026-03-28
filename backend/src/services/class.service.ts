import prisma from '../utils/prisma';

export async function getClasses(teacherId: string, date?: string) {
  const where: any = { teacherId };

  if (date) {
    const dayMap: Record<string, string> = {
      '0': '일', '1': '월', '2': '화', '3': '수', '4': '목', '5': '금', '6': '토',
    };
    const dayOfWeek = dayMap[new Date(date).getDay().toString()];
    if (dayOfWeek) {
      where.dayOfWeek = { contains: dayOfWeek };
    }
  }

  const classes = await prisma.class.findMany({
    where,
    include: { _count: { select: { students: true } } },
    orderBy: { startTime: 'asc' },
  });

  return classes.map((c) => ({
    id: c.id,
    name: c.name,
    subject: c.subject,
    dayOfWeek: c.dayOfWeek,
    startTime: c.startTime,
    endTime: c.endTime,
    room: c.room,
    maxStudents: c.maxStudents,
    studentCount: c._count.students,
    createdAt: c.createdAt,
  }));
}

export async function getClassById(classId: string, teacherId: string) {
  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId },
    include: {
      teacher: { select: { id: true, name: true, phone: true } },
      students: {
        include: {
          student: {
            include: { parents: true },
          },
        },
      },
    },
  });

  if (!cls) {
    throw Object.assign(new Error('수업을 찾을 수 없습니다.'), { status: 404 });
  }

  return {
    id: cls.id,
    name: cls.name,
    subject: cls.subject,
    dayOfWeek: cls.dayOfWeek,
    startTime: cls.startTime,
    endTime: cls.endTime,
    room: cls.room,
    maxStudents: cls.maxStudents,
    teacher: cls.teacher,
    students: cls.students.map((cs) => ({
      id: cs.student.id,
      name: cs.student.name,
      phone: cs.student.phone,
      grade: cs.student.grade,
      school: cs.student.school,
      enrolledAt: cs.enrolledAt,
      parents: cs.student.parents.map((p) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        relationship: p.relationship,
      })),
    })),
  };
}

export async function createClass(teacherId: string, data: {
  name: string;
  subject: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
  maxStudents?: number;
}) {
  return prisma.class.create({
    data: { ...data, teacherId },
  });
}

export async function updateClass(classId: string, teacherId: string, data: Record<string, any>) {
  const cls = await prisma.class.findFirst({ where: { id: classId, teacherId } });
  if (!cls) {
    throw Object.assign(new Error('수업을 찾을 수 없거나 수정 권한이 없습니다.'), { status: 403 });
  }

  return prisma.class.update({ where: { id: classId }, data });
}

export async function deleteClass(classId: string, teacherId: string) {
  const cls = await prisma.class.findFirst({ where: { id: classId, teacherId } });
  if (!cls) {
    throw Object.assign(new Error('수업을 찾을 수 없거나 삭제 권한이 없습니다.'), { status: 403 });
  }

  await prisma.class.delete({ where: { id: classId } });
}

export async function getClassStudents(classId: string, teacherId: string) {
  const cls = await prisma.class.findFirst({ where: { id: classId, teacherId } });
  if (!cls) {
    throw Object.assign(new Error('수업을 찾을 수 없습니다.'), { status: 404 });
  }

  const enrollments = await prisma.classStudent.findMany({
    where: { classId },
    include: {
      student: {
        include: { parents: true },
      },
    },
  });

  return enrollments.map((e) => ({
    id: e.student.id,
    name: e.student.name,
    phone: e.student.phone,
    grade: e.student.grade,
    school: e.student.school,
    enrolledAt: e.enrolledAt,
    parents: e.student.parents.map((p) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      relationship: p.relationship,
    })),
  }));
}

export async function enrollStudent(classId: string, studentId: string, teacherId: string) {
  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId },
    include: { _count: { select: { students: true } } },
  });

  if (!cls) {
    throw Object.assign(new Error('수업을 찾을 수 없습니다.'), { status: 404 });
  }

  if (cls._count.students >= cls.maxStudents) {
    throw Object.assign(new Error('수업 정원이 가득 찼습니다.'), { status: 400 });
  }

  try {
    await prisma.classStudent.create({
      data: { classId, studentId },
    });
  } catch (err: any) {
    if (err.code === 'P2002') {
      throw Object.assign(new Error('이미 등록된 학생입니다.'), { status: 409 });
    }
    throw err;
  }
}

export async function unenrollStudent(classId: string, studentId: string, teacherId: string) {
  const cls = await prisma.class.findFirst({ where: { id: classId, teacherId } });
  if (!cls) {
    throw Object.assign(new Error('수업을 찾을 수 없습니다.'), { status: 404 });
  }

  await prisma.classStudent.deleteMany({
    where: { classId, studentId },
  });
}
