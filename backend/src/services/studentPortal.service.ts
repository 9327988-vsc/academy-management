import prisma from '../utils/prisma';

export async function getStudentDashboard(phone: string | null) {
  if (!phone) return null;

  const student = await prisma.student.findFirst({
    where: { phone },
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
    return null;
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
      id: e.class.id,
      name: e.class.name,
      subject: e.class.subject,
      schedule: e.class.schedule,
      room: e.class.room,
    })),
    recentAttendance: student.attendances.slice(0, 15).map((a) => ({
      date: a.date,
      className: a.class.name,
      status: a.status,
    })),
  };
}
