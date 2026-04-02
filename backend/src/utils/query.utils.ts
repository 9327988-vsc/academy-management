import type { Prisma } from '@prisma/client';

// 페이지네이션 계산
export function calculatePagination(page: number = 1, pageSize: number = 10) {
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  return { skip, take };
}

// 날짜 필터 생성
export function buildDateFilter(filter: {
  startDate?: string | Date;
  endDate?: string | Date;
  date?: string | Date;
  month?: string;
}): Prisma.DateTimeFilter | Date | undefined {
  if (filter.date) {
    return new Date(filter.date);
  }

  if (filter.month) {
    const [year, month] = filter.month.split('-');
    return {
      gte: new Date(parseInt(year), parseInt(month) - 1, 1),
      lt: new Date(parseInt(year), parseInt(month), 1),
    };
  }

  if (filter.startDate || filter.endDate) {
    return {
      ...(filter.startDate && { gte: new Date(filter.startDate) }),
      ...(filter.endDate && { lte: new Date(filter.endDate) }),
    };
  }

  return undefined;
}

// 검색 필터 생성
export function buildSearchFilter(fields: string[], query?: string) {
  if (!query) return {};

  return {
    OR: fields.map(field => ({
      [field]: { contains: query },
    })),
  };
}

// 출석률 계산
export function calculateAttendanceRate(attendances: any[]): number {
  if (attendances.length === 0) return 100;

  const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
  return Math.round((presentCount / attendances.length) * 100);
}

// 결제율 계산
export function calculatePaymentRate(payments: any[]): number {
  if (payments.length === 0) return 100;

  const paidCount = payments.filter(p => p.status === 'PAID').length;
  return Math.round((paidCount / payments.length) * 100);
}
