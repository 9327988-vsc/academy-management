import prisma from '../utils/prisma';

// ClassSession → ClassSchedule 로 변경
export async function createSession(teacherId: number, data: {
  classId: number;
  date: string;
  startTime: string;
  endTime: string;
}) {
  const cls = await prisma.class.findFirst({
    where: { id: data.classId, teacherId },
  });
  if (!cls) {
    throw Object.assign(new Error('수업을 찾을 수 없습니다.'), { status: 404 });
  }

  return prisma.classSchedule.create({
    data: {
      classId: data.classId,
      date: new Date(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
      status: 'SCHEDULED',
    },
  });
}

export async function getSessionById(sessionId: number, teacherId: number) {
  const schedule = await prisma.classSchedule.findFirst({
    where: { id: sessionId },
    include: {
      class: {
        select: { id: true, name: true, subject: true, teacherId: true },
      },
    },
  });

  if (!schedule || schedule.class.teacherId !== teacherId) {
    throw Object.assign(new Error('일정을 찾을 수 없습니다.'), { status: 404 });
  }

  return {
    ...schedule,
    class: { id: schedule.class.id, name: schedule.class.name, subject: schedule.class.subject },
  };
}

export async function getClassSessions(classId: number, teacherId: number, limit = 10, offset = 0) {
  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId },
  });
  if (!cls) {
    throw Object.assign(new Error('수업을 찾을 수 없습니다.'), { status: 404 });
  }

  const [sessions, total] = await Promise.all([
    prisma.classSchedule.findMany({
      where: { classId },
      select: { id: true, date: true, startTime: true, endTime: true, status: true },
      orderBy: { date: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.classSchedule.count({ where: { classId } }),
  ]);

  return { sessions, total };
}
