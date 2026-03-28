import prisma from '../utils/prisma';

export async function createSession(teacherId: string, data: {
  classId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  topic?: string;
  textbook?: string;
  pages?: string;
  keyConcepts?: string;
  homework?: string;
  homeworkDueDate?: string;
  nextTopic?: string;
  specialNotes?: string;
}) {
  const cls = await prisma.class.findFirst({ where: { id: data.classId, teacherId } });
  if (!cls) {
    throw Object.assign(new Error('수업을 찾을 수 없습니다.'), { status: 404 });
  }

  const { classId, sessionDate, homeworkDueDate, ...rest } = data;

  return prisma.classSession.create({
    data: {
      classId,
      sessionDate: new Date(sessionDate),
      homeworkDueDate: homeworkDueDate ? new Date(homeworkDueDate) : null,
      ...rest,
    },
  });
}

export async function getSessionById(sessionId: string, teacherId: string) {
  const session = await prisma.classSession.findFirst({
    where: { id: sessionId },
    include: {
      class: {
        select: { id: true, name: true, subject: true, teacherId: true },
      },
      attendance: {
        include: { student: { select: { id: true, name: true } } },
      },
    },
  });

  if (!session || session.class.teacherId !== teacherId) {
    throw Object.assign(new Error('세션을 찾을 수 없습니다.'), { status: 404 });
  }

  return {
    ...session,
    class: { id: session.class.id, name: session.class.name, subject: session.class.subject },
    attendance: session.attendance.map((a) => ({
      id: a.id,
      studentId: a.student.id,
      studentName: a.student.name,
      status: a.status,
      checkTime: a.checkTime,
      notes: a.notes,
    })),
  };
}

export async function getClassSessions(classId: string, teacherId: string, limit = 10, offset = 0) {
  const cls = await prisma.class.findFirst({ where: { id: classId, teacherId } });
  if (!cls) {
    throw Object.assign(new Error('수업을 찾을 수 없습니다.'), { status: 404 });
  }

  const [sessions, total] = await Promise.all([
    prisma.classSession.findMany({
      where: { classId },
      select: { id: true, sessionDate: true, topic: true, notificationSent: true },
      orderBy: { sessionDate: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.classSession.count({ where: { classId } }),
  ]);

  return { sessions, total };
}
