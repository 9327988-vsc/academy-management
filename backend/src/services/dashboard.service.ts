import prisma from '../utils/prisma';

export async function getStats(userId: number) {
  // 사용자의 역할 확인
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { teacherProfile: true },
  });

  if (!user) {
    return {
      todayClasses: 0,
      totalStudents: 0,
      totalClasses: 0,
      todayClassList: [],
      recentAttendance: [],
    };
  }

  // ADMIN: 전체 통계
  if (user.role === 'ADMIN') {
    const [totalStudents, totalClasses, activeEnrollments, classes] = await Promise.all([
      prisma.student.count({ where: { deletedAt: null } }),
      prisma.class.count({ where: { status: 'ACTIVE' } }),
      prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
      prisma.class.findMany({
        where: { status: 'ACTIVE' },
        include: {
          enrollments: { where: { status: 'ACTIVE' } },
        },
        take: 20,
      }),
    ]);

    return {
      todayClasses: totalClasses,
      totalStudents,
      totalClasses,
      todayClassList: classes.map((c) => ({
        id: c.id,
        name: c.name,
        schedule: c.schedule,
        currentStudents: c.enrollments.length,
      })),
      recentAttendance: [],
    };
  }

  // TEACHER: 본인 수업 통계
  const teacher = user.teacherProfile;
  if (!teacher) {
    return {
      todayClasses: 0,
      totalStudents: 0,
      totalClasses: 0,
      todayClassList: [],
      recentAttendance: [],
    };
  }

  const [teacherWithClasses, totalEnrollments] = await Promise.all([
    prisma.teacher.findUnique({
      where: { id: teacher.id },
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
        class: { teacherId: teacher.id },
      },
    }),
  ]);

  const allClasses = teacherWithClasses?.classes || [];

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
