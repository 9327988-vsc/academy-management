import prisma from '../utils/prisma';

export async function getStudentDashboard(phone: string) {
  const student = await prisma.student.findFirst({
    where: { phone },
    include: {
      classes: {
        include: {
          class: { select: { id: true, name: true, subject: true, dayOfWeek: true, startTime: true, endTime: true, room: true } },
        },
      },
      attendance: {
        orderBy: { checkTime: 'desc' },
        take: 30,
        include: {
          session: { select: { sessionDate: true, class: { select: { name: true } } } },
        },
      },
    },
  });

  if (!student) {
    return null;
  }

  const totalAttendance = student.attendance.length;
  const presentCount = student.attendance.filter((a) => a.status === 'present').length;
  const lateCount = student.attendance.filter((a) => a.status === 'late').length;
  const absentCount = student.attendance.filter((a) => a.status === 'absent').length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  return {
    name: student.name,
    grade: student.grade,
    school: student.school,
    attendanceRate,
    stats: { total: totalAttendance, present: presentCount, late: lateCount, absent: absentCount },
    classes: student.classes.map((cs) => ({
      id: cs.class.id,
      name: cs.class.name,
      subject: cs.class.subject,
      dayOfWeek: cs.class.dayOfWeek,
      startTime: cs.class.startTime,
      endTime: cs.class.endTime,
      room: cs.class.room,
    })),
    recentAttendance: student.attendance.slice(0, 15).map((a) => ({
      date: a.session.sessionDate,
      className: a.session.class.name,
      status: a.status,
    })),
  };
}
