import prisma from '../utils/prisma';

export async function getSettings() {
  return prisma.academySettings.findFirst();
}

export async function upsertSettings(data: {
  academyName?: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  businessNumber?: string;
}) {
  const existing = await prisma.academySettings.findFirst();
  if (existing) {
    return prisma.academySettings.update({
      where: { id: existing.id },
      data,
    });
  }
  return prisma.academySettings.create({ data });
}
