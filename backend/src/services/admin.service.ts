import prisma from '../utils/prisma';

export async function listUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return users;
}

export async function updateUserRole(userId: string, role: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: role as any },
    select: { id: true, name: true, email: true, role: true },
  });
  return user;
}

export async function deleteUser(userId: string) {
  await prisma.user.delete({ where: { id: userId } });
}

export async function getSystemStats() {
  const [userCount, classCount, studentCount, sessionCount] = await Promise.all([
    prisma.user.count(),
    prisma.class.count(),
    prisma.student.count(),
    prisma.classSession.count(),
  ]);

  const usersByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: true,
  });

  return {
    users: userCount,
    classes: classCount,
    students: studentCount,
    sessions: sessionCount,
    usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count })),
  };
}
