import prisma from '../utils/prisma';

export async function getChildrenByParentPhone(phone: string) {
  // Find parent by phone
  const parent = await prisma.parent.findUnique({
    where: { phone },
    include: {
      students: {
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
      },
    },
  });

  if (!parent) return [];

  return parent.students.map((s) => {
    const totalAttendance = s.attendances.length;
    const presentCount = s.attendances.filter((a) => a.status === 'PRESENT').length;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    return {
      id: s.id,
      name: s.name,
      grade: s.grade,
      school: s.school,
      phone: s.phone,
      attendanceRate,
      totalClasses: totalAttendance,
      classes: s.enrollments.map((e) => ({
        id: e.class.id,
        name: e.class.name,
        subject: e.class.subject,
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
