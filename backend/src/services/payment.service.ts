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
  studentId: number;
  amount: number;
  month: string;
  dueDate: Date;
  description?: string;
  method?: string;
}) {
  return prisma.payment.create({
    data: {
      studentId: data.studentId,
      amount: data.amount,
      month: data.month,
      dueDate: data.dueDate,
      description: data.description,
      method: data.method,
    },
    include: { student: { select: { id: true, name: true } } },
  });
}

export async function updatePaymentStatus(id: number, status: string) {
  return prisma.payment.update({
    where: { id },
    data: {
      status: status as any,
      paidDate: status === 'PAID' ? new Date() : null,
    },
    include: { student: { select: { id: true, name: true } } },
  });
}

export async function deletePayment(id: number) {
  await prisma.payment.delete({ where: { id } });
}

export async function getPaymentStats() {
  const [total, paid, pending, overdue] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PENDING' } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'OVERDUE' } }),
  ]);
  return {
    totalAmount: total._sum.amount || 0,
    paidAmount: paid._sum.amount || 0,
    pendingAmount: pending._sum.amount || 0,
    overdueAmount: overdue._sum.amount || 0,
  };
}
