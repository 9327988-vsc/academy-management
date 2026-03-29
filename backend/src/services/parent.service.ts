import prisma from '../utils/prisma';

export async function getChildrenByParentPhone(phone: string) {
  const parentRecords = await prisma.parent.findMany({
    where: { phone },
    include: {
      student: {
        include: {
          classes: {
            include: {
              class: { select: { id: true, name: true, subject: true, dayOfWeek: true, startTime: true, endTime: true } },
            },
          },
          attendance: {
            orderBy: { checkTime: 'desc' },
            take: 20,
            include: {
              session: { select: { sessionDate: true, class: { select: { name: true } } } },
            },
          },
        },
      },
    },
  });

  return parentRecords.map((p) => {
    const s = p.student;
    const totalAttendance = s.attendance.length;
    const presentCount = s.attendance.filter((a) => a.status === 'present').length;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    return {
      id: s.id,
      name: s.name,
      grade: s.grade,
      school: s.school,
      phone: s.phone,
      attendanceRate,
      totalClasses: totalAttendance,
      classes: s.classes.map((cs) => ({
        id: cs.class.id,
        name: cs.class.name,
        subject: cs.class.subject,
        dayOfWeek: cs.class.dayOfWeek,
        startTime: cs.class.startTime,
        endTime: cs.class.endTime,
      })),
      recentAttendance: s.attendance.slice(0, 10).map((a) => ({
        date: a.session.sessionDate,
        className: a.session.class.name,
        status: a.status,
      })),
    };
  });
}
