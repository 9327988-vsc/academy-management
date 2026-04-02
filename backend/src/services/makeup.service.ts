import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils/error.utils';
import { calculatePagination } from '../utils/query.utils';

// ============================================
// 보강 슬롯
// ============================================

// 슬롯 생성
export async function createSlot(
  teacherId: number,
  data: {
    classId?: number;
    slotDate: string;
    startTime: string;
    endTime: string;
    maxStudents?: number;
    isRecurring?: boolean;
    recurringDay?: string;
  }
) {
  // startTime < endTime 검증
  if (data.startTime >= data.endTime) {
    throw new AppError(400, '종료 시간은 시작 시간보다 이후여야 합니다.');
  }

  // 시간 충돌 검사
  const slotDate = new Date(data.slotDate);
  const conflicting = await prisma.makeupSlot.findFirst({
    where: {
      teacherId,
      slotDate,
      OR: [
        {
          startTime: { lte: data.startTime },
          endTime: { gt: data.startTime },
        },
        {
          startTime: { lt: data.endTime },
          endTime: { gte: data.endTime },
        },
        {
          startTime: { gte: data.startTime },
          endTime: { lte: data.endTime },
        },
      ],
    },
  });

  if (conflicting) {
    throw new AppError(400, '해당 시간에 이미 등록된 일정이 있습니다.');
  }

  return await prisma.makeupSlot.create({
    data: {
      teacherId,
      classId: data.classId || null,
      slotDate,
      startTime: data.startTime,
      endTime: data.endTime,
      maxStudents: data.maxStudents ?? 3,
      isRecurring: data.isRecurring ?? false,
      recurringDay: data.recurringDay || null,
    },
  });
}

// 강사의 슬롯 목록 조회
export async function getSlots(
  teacherId: number | null,
  filters: {
    startDate: string;
    endDate: string;
    classId?: number;
    status?: string;
    page?: number;
    limit?: number;
  }
) {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 100);
  const { skip, take } = calculatePagination(page, limit);

  const where: Prisma.MakeupSlotWhereInput = {
    ...(teacherId && { teacherId }),
    slotDate: {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate),
    },
    ...(filters.classId && { classId: filters.classId }),
    ...(filters.status && { status: filters.status as any }),
  };

  const [slots, total] = await Promise.all([
    prisma.makeupSlot.findMany({
      where,
      skip,
      take,
      orderBy: [{ slotDate: 'asc' }, { startTime: 'asc' }],
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        class: { select: { id: true, name: true } },
        requests: {
          select: {
            id: true,
            status: true,
            student: { select: { name: true } },
          },
        },
      },
    }),
    prisma.makeupSlot.count({ where }),
  ]);

  return {
    slots: slots.map((s) => ({
      id: s.id,
      teacherId: s.teacherId,
      teacherName: s.teacher.user.name,
      classId: s.classId,
      className: s.class?.name || null,
      slotDate: s.slotDate,
      startTime: s.startTime,
      endTime: s.endTime,
      maxStudents: s.maxStudents,
      currentCount: s.currentCount,
      status: s.status,
      isRecurring: s.isRecurring,
      recurringDay: s.recurringDay,
      requests: s.requests.map((r) => ({
        id: r.id,
        studentName: r.student.name,
        status: r.status,
      })),
    })),
    total,
    page,
    limit,
  };
}

// 학생/학부모용 가용 슬롯 조회
export async function getAvailableSlots(
  studentId: number,
  filters: {
    classId?: number;
    startDate?: string;
    endDate?: string;
  }
) {
  // 학생이 수강 중인 수업의 강사 ID 목록
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId, status: 'ACTIVE' },
    include: { class: { select: { id: true, teacherId: true } } },
  });

  if (enrollments.length === 0) {
    return { slots: [], total: 0 };
  }

  const teacherIds = [...new Set(enrollments.map((e) => e.class.teacherId))];
  const classIds = enrollments.map((e) => e.class.id);

  const now = new Date();
  const startDate = filters.startDate ? new Date(filters.startDate) : now;
  const endDate = filters.endDate
    ? new Date(filters.endDate)
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // classId 필터가 있으면 수강 중인 수업인지 검증 후 해당 수업 슬롯만 반환
  const slotClassFilter: Prisma.MakeupSlotWhereInput[] = filters.classId
    ? classIds.includes(filters.classId)
      ? [{ classId: null }, { classId: filters.classId }]
      : [{ classId: null }] // 수강하지 않는 수업은 무시
    : [{ classId: null }, { classId: { in: classIds } }];

  const where: Prisma.MakeupSlotWhereInput = {
    teacherId: { in: teacherIds },
    status: 'AVAILABLE',
    slotDate: { gte: startDate, lte: endDate },
    OR: slotClassFilter,
  };

  const slots = await prisma.makeupSlot.findMany({
    where,
    orderBy: [{ slotDate: 'asc' }, { startTime: 'asc' }],
    include: {
      teacher: { include: { user: { select: { name: true } } } },
      class: { select: { name: true } },
    },
  });

  return {
    slots: slots.map((s) => ({
      id: s.id,
      teacherName: s.teacher.user.name,
      className: s.class?.name || null,
      slotDate: s.slotDate,
      startTime: s.startTime,
      endTime: s.endTime,
      maxStudents: s.maxStudents,
      currentCount: s.currentCount,
      remainingSpots: s.maxStudents - s.currentCount,
    })),
    total: slots.length,
  };
}

// 슬롯 수정
export async function updateSlot(
  slotId: number,
  teacherId: number | null,
  data: {
    slotDate?: string;
    startTime?: string;
    endTime?: string;
    maxStudents?: number;
    status?: string;
  }
) {
  const slot = await prisma.makeupSlot.findUnique({
    where: { id: slotId },
    include: { requests: { where: { status: 'APPROVED' } } },
  });

  if (!slot) {
    throw new AppError(404, '보강 슬롯을 찾을 수 없습니다.');
  }

  if (teacherId && slot.teacherId !== teacherId) {
    throw new AppError(403, '본인의 보강 슬롯만 수정할 수 있습니다.');
  }

  // 승인된 신청이 있으면 날짜/시간 변경 불가
  if (slot.requests.length > 0 && (data.slotDate || data.startTime || data.endTime)) {
    throw new AppError(400, '승인된 보강 신청이 있어 시간을 변경할 수 없습니다.');
  }

  // maxStudents 변경 시 현재 승인 수보다 작게 설정 불가
  if (data.maxStudents !== undefined && data.maxStudents < slot.currentCount) {
    throw new AppError(400, `이미 ${slot.currentCount}명이 승인되어 최대 인원을 줄일 수 없습니다.`);
  }

  const updateData: Prisma.MakeupSlotUpdateInput = {};
  if (data.slotDate) updateData.slotDate = new Date(data.slotDate);
  if (data.startTime) updateData.startTime = data.startTime;
  if (data.endTime) updateData.endTime = data.endTime;
  if (data.maxStudents !== undefined) updateData.maxStudents = data.maxStudents;
  if (data.status) updateData.status = data.status as any;

  // 날짜/시간 변경 시 충돌 검사
  if (data.slotDate || data.startTime || data.endTime) {
    const checkDate = data.slotDate ? new Date(data.slotDate) : slot.slotDate;
    const checkStart = data.startTime || slot.startTime;
    const checkEnd = data.endTime || slot.endTime;

    const conflicting = await prisma.makeupSlot.findFirst({
      where: {
        teacherId: slot.teacherId,
        slotDate: checkDate,
        id: { not: slotId },
        OR: [
          { startTime: { lte: checkStart }, endTime: { gt: checkStart } },
          { startTime: { lt: checkEnd }, endTime: { gte: checkEnd } },
          { startTime: { gte: checkStart }, endTime: { lte: checkEnd } },
        ],
      },
    });

    if (conflicting) {
      throw new AppError(400, '해당 시간에 이미 등록된 일정이 있습니다.');
    }
  }

  return await prisma.makeupSlot.update({
    where: { id: slotId },
    data: updateData,
  });
}

// 슬롯 삭제
export async function deleteSlot(slotId: number, teacherId: number | null) {
  const slot = await prisma.makeupSlot.findUnique({
    where: { id: slotId },
    include: {
      requests: {
        where: { status: { in: ['APPROVED', 'COMPLETED'] } },
      },
    },
  });

  if (!slot) {
    throw new AppError(404, '보강 슬롯을 찾을 수 없습니다.');
  }

  if (teacherId && slot.teacherId !== teacherId) {
    throw new AppError(403, '본인의 보강 슬롯만 삭제할 수 있습니다.');
  }

  if (slot.requests.length > 0) {
    throw new AppError(400, '승인된 보강 신청이 있어 삭제할 수 없습니다. 먼저 슬롯을 닫아주세요.');
  }

  // PENDING 신청은 자동 취소
  await prisma.$transaction([
    prisma.makeupRequest.updateMany({
      where: { slotId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    }),
    prisma.makeupSlot.delete({ where: { id: slotId } }),
  ]);
}

// ============================================
// 보강 신청
// ============================================

// 신청 생성
export async function createRequest(data: {
  studentId: number;
  originalAttendanceId: number;
  slotId: number;
  studentNote?: string;
}) {
  // 출석 기록 검증 (트랜잭션 밖에서 수행 — 변경되지 않는 데이터)
  const attendance = await prisma.attendance.findUnique({
    where: { id: data.originalAttendanceId },
    include: { class: { select: { id: true, name: true, teacherId: true } } },
  });

  if (!attendance) {
    throw new AppError(404, '출석 기록을 찾을 수 없습니다.');
  }

  if (attendance.studentId !== data.studentId) {
    throw new AppError(403, '해당 학생의 보강을 신청할 권한이 없습니다.');
  }

  if (attendance.status !== 'ABSENT' && attendance.status !== 'EXCUSED') {
    throw new AppError(400, '결석 또는 인정결석 기록만 보강 신청이 가능합니다.');
  }

  // 트랜잭션으로 중복 검사 + 슬롯 검증 + 생성을 원자적으로 수행
  const request = await prisma.$transaction(async (tx) => {
    // 중복 신청 검사
    const existing = await tx.makeupRequest.findUnique({
      where: {
        studentId_originalAttendanceId: {
          studentId: data.studentId,
          originalAttendanceId: data.originalAttendanceId,
        },
      },
    });

    if (existing) {
      throw new AppError(409, '해당 결석에 대해 이미 보강 신청이 존재합니다.');
    }

    // 슬롯 검증
    const slot = await tx.makeupSlot.findUnique({
      where: { id: data.slotId },
    });

    if (!slot) {
      throw new AppError(404, '보강 슬롯을 찾을 수 없습니다.');
    }

    if (slot.status === 'CLOSED') {
      throw new AppError(400, '해당 보강 슬롯은 마감되었습니다.');
    }

    if (slot.status === 'FULL' || slot.currentCount >= slot.maxStudents) {
      throw new AppError(400, '해당 보강 슬롯이 가득 찼습니다.');
    }

    return await tx.makeupRequest.create({
      data: {
        studentId: data.studentId,
        originalAttendanceId: data.originalAttendanceId,
        slotId: data.slotId,
        studentNote: data.studentNote || null,
      },
      include: {
        student: { select: { name: true } },
        originalAttendance: {
          select: { date: true, class: { select: { name: true } } },
        },
        slot: { select: { slotDate: true, startTime: true, endTime: true } },
      },
    });
  });

  return {
    id: request.id,
    studentId: request.studentId,
    studentName: request.student.name,
    originalAttendanceId: request.originalAttendanceId,
    originalDate: request.originalAttendance.date,
    className: request.originalAttendance.class.name,
    slotId: request.slotId,
    slotDate: request.slot.slotDate,
    slotTime: `${request.slot.startTime} - ${request.slot.endTime}`,
    status: request.status,
    studentNote: request.studentNote,
    requestedAt: request.requestedAt,
  };
}

// 신청 목록 조회 (역할별 필터)
export async function getRequests(
  userId: number,
  role: string,
  filters: {
    status?: string;
    studentId?: number;
    classId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }
) {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 100);
  const { skip, take } = calculatePagination(page, limit);

  let where: Prisma.MakeupRequestWhereInput = {};

  // 역할별 데이터 격리
  if (role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new AppError(404, '학생 프로필을 찾을 수 없습니다.');
    where.studentId = student.id;
  } else if (role === 'PARENT') {
    const parent = await prisma.parent.findUnique({
      where: { userId },
      include: { students: { select: { id: true } } },
    });
    if (!parent) throw new AppError(404, '학부모 프로필을 찾을 수 없습니다.');
    where.studentId = { in: parent.students.map((s) => s.id) };
  } else if (role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) throw new AppError(404, '강사 프로필을 찾을 수 없습니다.');
    where.slot = { teacherId: teacher.id };
  }
  // ADMIN: no filter

  if (filters.status) where.status = filters.status as any;
  if (filters.studentId && (role === 'TEACHER' || role === 'ADMIN')) {
    where.studentId = filters.studentId;
  }
  if (filters.startDate || filters.endDate) {
    where.requestedAt = {
      ...(filters.startDate && { gte: new Date(filters.startDate) }),
      ...(filters.endDate && { lte: new Date(filters.endDate) }),
    };
  }

  const [requests, total] = await Promise.all([
    prisma.makeupRequest.findMany({
      where,
      skip,
      take,
      orderBy: { requestedAt: 'desc' },
      include: {
        student: { select: { id: true, name: true } },
        originalAttendance: {
          select: {
            id: true,
            date: true,
            status: true,
            class: { select: { id: true, name: true } },
          },
        },
        slot: {
          select: {
            id: true,
            slotDate: true,
            startTime: true,
            endTime: true,
            teacher: { include: { user: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.makeupRequest.count({ where }),
  ]);

  return {
    requests: requests.map((r) => ({
      id: r.id,
      studentId: r.student.id,
      studentName: r.student.name,
      originalAttendance: {
        id: r.originalAttendance.id,
        date: r.originalAttendance.date,
        className: r.originalAttendance.class.name,
        status: r.originalAttendance.status,
      },
      slot: {
        id: r.slot.id,
        slotDate: r.slot.slotDate,
        startTime: r.slot.startTime,
        endTime: r.slot.endTime,
        teacherName: r.slot.teacher.user.name,
      },
      status: r.status,
      studentNote: r.studentNote,
      teacherNote: r.teacherNote,
      requestedAt: r.requestedAt,
      approvedAt: r.approvedAt,
      completedAt: r.completedAt,
    })),
    total,
    page,
    limit,
  };
}

// 강사용 대기 중 신청 조회
export async function getPendingRequests(
  teacherId: number | null,
  filters: {
    classId?: number;
    page?: number;
    limit?: number;
  }
) {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 100);
  const { skip, take } = calculatePagination(page, limit);

  const where: Prisma.MakeupRequestWhereInput = {
    status: 'PENDING',
    ...(teacherId && { slot: { teacherId } }),
  };

  if (filters.classId) {
    where.originalAttendance = { classId: filters.classId };
  }

  const [requests, total] = await Promise.all([
    prisma.makeupRequest.findMany({
      where,
      skip,
      take,
      orderBy: { requestedAt: 'asc' },
      include: {
        student: { select: { name: true, phone: true } },
        originalAttendance: {
          select: {
            date: true,
            note: true,
            class: { select: { name: true } },
          },
        },
        slot: {
          select: {
            id: true,
            slotDate: true,
            startTime: true,
            endTime: true,
            currentCount: true,
            maxStudents: true,
          },
        },
      },
    }),
    prisma.makeupRequest.count({ where }),
  ]);

  return {
    requests: requests.map((r) => ({
      id: r.id,
      studentName: r.student.name,
      studentPhone: r.student.phone,
      originalDate: r.originalAttendance.date,
      originalClassName: r.originalAttendance.class.name,
      absentReason: r.originalAttendance.note,
      requestedSlot: {
        id: r.slot.id,
        slotDate: r.slot.slotDate,
        startTime: r.slot.startTime,
        endTime: r.slot.endTime,
        currentCount: r.slot.currentCount,
        maxStudents: r.slot.maxStudents,
      },
      studentNote: r.studentNote,
      requestedAt: r.requestedAt,
    })),
    total,
    page,
    limit,
  };
}

// 신청 상태 변경
export async function updateRequestStatus(
  requestId: number,
  userId: number,
  role: string,
  action: string,
  teacherNote?: string
) {
  // 권한 검증용 사전 조회 (트랜잭션 밖)
  const request = await prisma.makeupRequest.findUnique({
    where: { id: requestId },
    include: {
      slot: { select: { id: true, teacherId: true, currentCount: true, maxStudents: true } },
      student: { select: { id: true, userId: true, parentId: true } },
    },
  });

  if (!request) {
    throw new AppError(404, '보강 신청을 찾을 수 없습니다.');
  }

  // 권한 검증
  if (action === 'APPROVE' || action === 'REJECT' || action === 'COMPLETE') {
    if (role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId } });
      if (!teacher || teacher.id !== request.slot.teacherId) {
        throw new AppError(403, '권한이 없습니다.');
      }
    } else if (role !== 'ADMIN') {
      throw new AppError(403, '권한이 없습니다.');
    }
  } else if (action === 'CANCEL') {
    if (role === 'STUDENT') {
      if (request.student.userId !== userId) {
        throw new AppError(403, '권한이 없습니다.');
      }
    } else if (role === 'PARENT') {
      const parent = await prisma.parent.findUnique({ where: { userId } });
      if (!parent || request.student.parentId !== parent.id) {
        throw new AppError(403, '권한이 없습니다.');
      }
    }
    // TEACHER, ADMIN can cancel any
  }

  // 상태 전이 규칙
  const validTransitions: Record<string, Record<string, string>> = {
    PENDING: { APPROVE: 'APPROVED', REJECT: 'REJECTED', CANCEL: 'CANCELLED' },
    APPROVED: { COMPLETE: 'COMPLETED', CANCEL: 'CANCELLED' },
  };

  // 트랜잭션 내에서 상태 재검증 + 변경 + currentCount 동기화
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    // 트랜잭션 내에서 최신 상태 다시 조회 (TOCTOU 방지)
    const freshRequest = await tx.makeupRequest.findUnique({
      where: { id: requestId },
      include: {
        slot: { select: { id: true, currentCount: true, maxStudents: true, status: true } },
      },
    });

    if (!freshRequest) {
      throw new AppError(404, '보강 신청을 찾을 수 없습니다.');
    }

    const currentTransitions = validTransitions[freshRequest.status];
    if (!currentTransitions || !currentTransitions[action]) {
      throw new AppError(400, '현재 상태에서는 해당 작업을 수행할 수 없습니다.');
    }

    const newStatus = currentTransitions[action];

    const updateData: Prisma.MakeupRequestUpdateInput = {
      status: newStatus as any,
      ...(teacherNote !== undefined && { teacherNote }),
      ...(action === 'APPROVE' && { approvedAt: now }),
      ...(action === 'COMPLETE' && { completedAt: now }),
    };

    const updated = await tx.makeupRequest.update({
      where: { id: requestId },
      data: updateData,
    });

    // currentCount 동기화
    if (action === 'APPROVE') {
      // 승인 시 슬롯이 이미 FULL이면 거부
      if (freshRequest.slot.currentCount >= freshRequest.slot.maxStudents) {
        throw new AppError(400, '해당 보강 슬롯이 가득 찼습니다.');
      }
      const slot = await tx.makeupSlot.update({
        where: { id: freshRequest.slot.id },
        data: { currentCount: { increment: 1 } },
      });
      // FULL 자동 전환
      if (slot.currentCount >= slot.maxStudents) {
        await tx.makeupSlot.update({
          where: { id: freshRequest.slot.id },
          data: { status: 'FULL' },
        });
      }
    } else if (
      action === 'CANCEL' &&
      freshRequest.status === 'APPROVED'
    ) {
      const slot = await tx.makeupSlot.update({
        where: { id: freshRequest.slot.id },
        data: { currentCount: { decrement: 1 } },
      });
      // FULL -> AVAILABLE 복원
      if (slot.currentCount < slot.maxStudents && slot.status === 'FULL') {
        await tx.makeupSlot.update({
          where: { id: freshRequest.slot.id },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    return updated;
  });

  return {
    id: result.id,
    status: result.status,
    teacherNote: result.teacherNote,
    approvedAt: result.approvedAt,
    completedAt: result.completedAt,
  };
}
