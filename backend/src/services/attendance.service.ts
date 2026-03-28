import { AttendanceStatus } from '@prisma/client';
import prisma from '../utils/prisma';

export async function bulkCreate(teacherId: string, data: {
  sessionId: string;
  attendance: { studentId: string; status: AttendanceStatus; notes?: string }[];
}) {
  const session = await prisma.classSession.findFirst({
    where: { id: data.sessionId },
    include: { class: { select: { teacherId: true } } },
  });

  if (!session || session.class.teacherId !== teacherId) {
    throw Object.assign(new Error('세션을 찾을 수 없습니다.'), { status: 404 });
  }

  const results = await prisma.$transaction(
    data.attendance.map((a) =>
      prisma.attendance.upsert({
        where: {
          unique_attendance: {
            sessionId: data.sessionId,
            studentId: a.studentId,
          },
        },
        update: { status: a.status, notes: a.notes || null },
        create: {
          sessionId: data.sessionId,
          studentId: a.studentId,
          status: a.status,
          notes: a.notes || null,
        },
      }),
    ),
  );

  return { count: results.length };
}

export async function updateAttendance(attendanceId: string, teacherId: string, data: {
  status: AttendanceStatus;
  notes?: string;
}) {
  const attendance = await prisma.attendance.findFirst({
    where: { id: attendanceId },
    include: { session: { include: { class: { select: { teacherId: true } } } } },
  });

  if (!attendance || attendance.session.class.teacherId !== teacherId) {
    throw Object.assign(new Error('출석 기록을 찾을 수 없습니다.'), { status: 404 });
  }

  return prisma.attendance.update({
    where: { id: attendanceId },
    data: { status: data.status, notes: data.notes || null },
  });
}

export async function getSessionAttendance(sessionId: string, teacherId: string) {
  const session = await prisma.classSession.findFirst({
    where: { id: sessionId },
    include: { class: { select: { teacherId: true } } },
  });

  if (!session || session.class.teacherId !== teacherId) {
    throw Object.assign(new Error('세션을 찾을 수 없습니다.'), { status: 404 });
  }

  const attendance = await prisma.attendance.findMany({
    where: { sessionId },
    include: { student: { select: { id: true, name: true } } },
    orderBy: { student: { name: 'asc' } },
  });

  const stats = {
    present: attendance.filter((a) => a.status === 'present').length,
    absent: attendance.filter((a) => a.status === 'absent').length,
    late: attendance.filter((a) => a.status === 'late').length,
    total: attendance.length,
  };

  return {
    sessionId,
    sessionDate: session.sessionDate,
    attendance: attendance.map((a) => ({
      id: a.id,
      studentId: a.student.id,
      studentName: a.student.name,
      status: a.status,
      checkTime: a.checkTime,
      notes: a.notes,
    })),
    stats,
  };
}
