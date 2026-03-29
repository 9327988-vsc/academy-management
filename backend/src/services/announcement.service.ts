import prisma from '../utils/prisma';

export async function listAnnouncements() {
  return prisma.announcement.findMany({
    include: { author: { select: { id: true, name: true } } },
    orderBy: [{ important: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function createAnnouncement(data: {
  title: string;
  content: string;
  important?: boolean;
  authorId: string;
}) {
  return prisma.announcement.create({
    data,
    include: { author: { select: { id: true, name: true } } },
  });
}

export async function updateAnnouncement(id: string, data: {
  title?: string;
  content?: string;
  important?: boolean;
}) {
  return prisma.announcement.update({
    where: { id },
    data,
    include: { author: { select: { id: true, name: true } } },
  });
}

export async function deleteAnnouncement(id: string) {
  await prisma.announcement.delete({ where: { id } });
}
