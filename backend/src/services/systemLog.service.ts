import prisma from '../utils/prisma';

export async function listLogs(limit = 100, offset = 0) {
  const [logs, total] = await Promise.all([
    prisma.systemLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.systemLog.count(),
  ]);
  return { logs, total };
}

export async function createLog(data: {
  userId?: string;
  userName?: string;
  action: string;
  target?: string;
  detail?: string;
}) {
  return prisma.systemLog.create({ data });
}
