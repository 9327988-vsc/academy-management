import prisma from '../utils/prisma';

export async function getStats(teacherId: string) {
  const today = new Date();
  const dayMap: Record<number, string> = {
    0: '일', 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토',
  };
  const todayDay = dayMap[today.getDay()];

  const [allClasses, totalStudents, recentSessions] = await Promise.all([
    prisma.class.findMany({
      where: { teacherId },
      select: { id: true, name: true, dayOfWeek: true, startTime: true, endTime: true },
    }),
    prisma.student.count({ where: { teacherId } }),
    prisma.classSession.findMany({
      where: { class: { teacherId } },
      include: { class: { select: { id: true, name: true } } },
      orderBy: { sessionDate: 'desc' },
      take: 5,
    }),
  ]);

  const todayClasses = allClasses.filter((c) => c.dayOfWeek.includes(todayDay));

  return {
    todayClasses: todayClasses.length,
    totalStudents,
    totalClasses: allClasses.length,
    todayClassList: todayClasses.map((c) => ({
      id: c.id,
      name: c.name,
      startTime: c.startTime,
      endTime: c.endTime,
    })),
    recentSessions: recentSessions.map((s) => ({
      id: s.id,
      classId: s.class.id,
      className: s.class.name,
      sessionDate: s.sessionDate,
      notificationSent: s.notificationSent,
    })),
  };
}
