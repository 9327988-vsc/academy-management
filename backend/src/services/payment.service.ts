import prisma from '../utils/prisma';

export async function listPayments(filters?: { status?: string; month?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.month) where.month = filters.month;

  return prisma.payment.findMany({
    where,
    include: { student: { select: { id: true, name: true, grade: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createPayment(data: {
  studentId: string;
  amount: number;
  month: string;
  description?: string;
}) {
  return prisma.payment.create({
    data,
    include: { student: { select: { id: true, name: true } } },
  });
}

export async function updatePaymentStatus(id: string, status: string) {
  return prisma.payment.update({
    where: { id },
    data: {
      status: status as any,
      paidAt: status === 'paid' ? new Date() : null,
    },
    include: { student: { select: { id: true, name: true } } },
  });
}

export async function deletePayment(id: string) {
  await prisma.payment.delete({ where: { id } });
}

export async function getPaymentStats() {
  const [total, paid, unpaid, overdue] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'paid' } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'unpaid' } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'overdue' } }),
  ]);
  return {
    totalAmount: total._sum.amount || 0,
    paidAmount: paid._sum.amount || 0,
    unpaidAmount: unpaid._sum.amount || 0,
    overdueAmount: overdue._sum.amount || 0,
  };
}
