import prisma from '../utils/prisma';

export async function getStats(teacherId: number) {
  const [teacher, totalEnrollments] = await Promise.all([
    prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        classes: {
          where: { status: 'ACTIVE' },
          include: {
            enrollments: { where: { status: 'ACTIVE' } },
          },
        },
      },
    }),
    prisma.enrollment.count({
      where: {
        status: 'ACTIVE',
        class: { teacherId },
      },
    }),
  ]);

  if (!teacher) {
    return {
      todayClasses: 0,
      totalStudents: 0,
      totalClasses: 0,
      todayClassList: [],
      recentAttendance: [],
    };
  }

  const allClasses = teacher.classes;

  return {
    todayClasses: allClasses.length,
    totalStudents: totalEnrollments,
    totalClasses: allClasses.length,
    todayClassList: allClasses.map((c) => ({
      id: c.id,
      name: c.name,
      schedule: c.schedule,
      currentStudents: c.enrollments.length,
    })),
    recentAttendance: [],
  };
}
