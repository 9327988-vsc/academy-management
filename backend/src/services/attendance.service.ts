import { AttendanceStatus } from '@prisma/client';
import prisma from '../utils/prisma';

// userId로 teacherId 조회하는 헬퍼
async function resolveTeacherId(userId: number): Promise<number | null> {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  return teacher?.id || null;
}

export async function bulkCreate(userId: number, data: {
  classId: number;
  date: string;
  attendance: { studentId: number; status: AttendanceStatus; note?: string }[];
}) {
  const teacherId = await resolveTeacherId(userId);

  // Verify teacher owns this class (or is admin)
  const cls = await prisma.class.findFirst({
    where: {
      id: data.classId,
      ...(teacherId ? { teacherId } : {}),
    },
  });

  if (!cls) {
    throw Object.assign(new Error('수업을 찾을 수 없습니다.'), { status: 404 });
  }

  const attendanceDate = new Date(data.date);

  const results = await prisma.$transaction(
    data.attendance.map((a) =>
      prisma.attendance.upsert({
        where: {
          studentId_classId_date: {
            studentId: a.studentId,
            classId: data.classId,
            date: attendanceDate,
          },
        },
        update: { status: a.status, note: a.note || null },
        create: {
          studentId: a.studentId,
          classId: data.classId,
          date: attendanceDate,
          status: a.status,
          note: a.note || null,
          checkInTime: new Date(),
          recordedBy: String(userId),
        },
      }),
    ),
  );

  return { count: results.length };
}

export async function updateAttendance(attendanceId: number, userId: number, data: {
  status: AttendanceStatus;
  note?: string;
}) {
  const teacherId = await resolveTeacherId(userId);

  const attendance = await prisma.attendance.findFirst({
    where: { id: attendanceId },
    include: { class: { select: { teacherId: true } } },
  });

  if (!attendance || (teacherId && attendance.class.teacherId !== teacherId)) {
    throw Object.assign(new Error('출석 기록을 찾을 수 없습니다.'), { status: 404 });
  }

  return prisma.attendance.update({
    where: { id: attendanceId },
    data: { status: data.status, note: data.note || null },
  });
}

export async function getClassAttendance(classId: number, userId: number, date?: string) {
  const teacherId = await resolveTeacherId(userId);

  const cls = await prisma.class.findFirst({
    where: {
      id: classId,
      ...(teacherId ? { teacherId } : {}),
    },
  });

  if (!cls) {
    throw Object.assign(new Error('수업을 찾을 수 없습니다.'), { status: 404 });
  }

  const where: any = { classId };
  if (date) {
    const targetDate = new Date(date);
    where.date = {
      gte: new Date(targetDate.setHours(0, 0, 0, 0)),
      lt: new Date(targetDate.setHours(23, 59, 59, 999)),
    };
  }

  const attendance = await prisma.attendance.findMany({
    where,
    include: { student: { select: { id: true, name: true } } },
    orderBy: { student: { name: 'asc' } },
  });

  const stats = {
    present: attendance.filter((a) => a.status === 'PRESENT').length,
    absent: attendance.filter((a) => a.status === 'ABSENT').length,
    late: attendance.filter((a) => a.status === 'LATE').length,
    excused: attendance.filter((a) => a.status === 'EXCUSED').length,
    total: attendance.length,
  };

  return {
    classId,
    date,
    attendance: attendance.map((a) => ({
      id: a.id,
      studentId: a.student.id,
      studentName: a.student.name,
      status: a.status,
      checkInTime: a.checkInTime,
      note: a.note,
    })),
    stats,
  };
}
