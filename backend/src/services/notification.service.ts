import prisma from '../utils/prisma';

function buildMessage(params: {
  className: string;
  sessionDate: string;
  topic?: string | null;
  textbook?: string | null;
  pages?: string | null;
  keyConcepts?: string | null;
  homework?: string | null;
  homeworkDueDate?: Date | null;
  nextTopic?: string | null;
  studentName: string;
  isAbsent: boolean;
}) {
  const dateStr = new Date(params.sessionDate).toLocaleDateString('ko-KR', {
    month: 'numeric', day: 'numeric', weekday: 'short',
  });

  if (params.isAbsent) {
    let msg = `[학원] ${params.studentName} 학생 결석 알림\n\n`;
    msg += `오늘(${dateStr}) ${params.className} 수업에 결석하셨습니다.\n\n`;
    if (params.topic) msg += `오늘 진도: ${params.topic}`;
    if (params.pages) msg += ` (${params.pages})`;
    msg += '\n';
    if (params.homework) {
      msg += `\n과제: ${params.homework}\n`;
      if (params.homeworkDueDate) {
        const dueStr = new Date(params.homeworkDueDate).toLocaleDateString('ko-KR', {
          month: 'numeric', day: 'numeric', weekday: 'short',
        });
        msg += `제출: ${dueStr} 수업 전\n`;
      }
    }
    return msg;
  }

  let msg = `[학원] ${params.studentName} 학생 수업 알림\n\n`;
  msg += `오늘 수업 (${dateStr})\n`;
  msg += `- 과목: ${params.className}\n`;
  if (params.topic) {
    msg += `- 진도: ${params.topic}`;
    if (params.pages) msg += ` (${params.pages})`;
    msg += '\n';
  }
  if (params.keyConcepts) msg += `- 핵심: ${params.keyConcepts}\n`;

  if (params.homework) {
    msg += `\n숙제: ${params.homework}\n`;
    if (params.homeworkDueDate) {
      const dueStr = new Date(params.homeworkDueDate).toLocaleDateString('ko-KR', {
        month: 'numeric', day: 'numeric', weekday: 'short',
      });
      msg += `제출: ${dueStr} 수업 전\n`;
    }
  }

  if (params.nextTopic) msg += `\n다음 수업 예정: ${params.nextTopic}\n`;

  return msg;
}

export async function previewNotification(sessionId: string, teacherId: string) {
  const session = await prisma.classSession.findFirst({
    where: { id: sessionId },
    include: {
      class: {
        select: { name: true, teacherId: true },
      },
      attendance: {
        include: {
          student: {
            include: { parents: true },
          },
        },
      },
    },
  });

  if (!session || session.class.teacherId !== teacherId) {
    throw Object.assign(new Error('세션을 찾을 수 없습니다.'), { status: 404 });
  }

  if (session.attendance.length === 0) {
    throw Object.assign(new Error('출석 체크를 먼저 완료해주세요.'), { status: 400 });
  }

  const msgParams = {
    className: session.class.name,
    sessionDate: session.sessionDate.toISOString(),
    topic: session.topic,
    textbook: session.textbook,
    pages: session.pages,
    keyConcepts: session.keyConcepts,
    homework: session.homework,
    homeworkDueDate: session.homeworkDueDate,
    nextTopic: session.nextTopic,
  };

  const presentStudents = session.attendance
    .filter((a) => a.status !== 'absent')
    .map((a) => {
      const message = buildMessage({ ...msgParams, studentName: a.student.name, isAbsent: false });
      const recipients = [
        { type: 'student' as const, name: a.student.name, phone: a.student.phone || '' },
        ...a.student.parents.map((p) => ({ type: 'parent' as const, name: p.name, phone: p.phone })),
      ].filter((r) => r.phone);
      return { studentId: a.student.id, studentName: a.student.name, message, recipients };
    });

  const absentStudents = session.attendance
    .filter((a) => a.status === 'absent')
    .map((a) => {
      const message = buildMessage({ ...msgParams, studentName: a.student.name, isAbsent: true });
      const recipients = [
        { type: 'student' as const, name: a.student.name, phone: a.student.phone || '' },
        ...a.student.parents.map((p) => ({ type: 'parent' as const, name: p.name, phone: p.phone })),
      ].filter((r) => r.phone);
      return { studentId: a.student.id, studentName: a.student.name, message, recipients };
    });

  const totalRecipients = [...presentStudents, ...absentStudents]
    .reduce((sum, s) => sum + s.recipients.length, 0);

  return { presentStudents, absentStudents, totalRecipients };
}

export async function sendNotification(sessionId: string, teacherId: string) {
  const preview = await previewNotification(sessionId, teacherId);
  const allStudents = [...preview.presentStudents, ...preview.absentStudents];
  const details: any[] = [];

  for (const student of allStudents) {
    for (const recipient of student.recipients) {
      // MVP: 콘솔 로그로 대체 (Phase 2에서 실제 SMS 발송)
      console.log(`[SMS 발송] ${recipient.name} (${recipient.phone}): ${student.message.substring(0, 50)}...`);

      const notification = await prisma.notification.create({
        data: {
          sessionId,
          recipientPhone: recipient.phone,
          recipientName: recipient.name,
          recipientType: recipient.type,
          content: student.message,
          status: 'sent',
          sentAt: new Date(),
        },
      });

      details.push({
        recipientName: recipient.name,
        recipientPhone: recipient.phone,
        recipientType: recipient.type,
        status: 'sent',
        sentAt: notification.sentAt,
      });
    }
  }

  await prisma.classSession.update({
    where: { id: sessionId },
    data: { notificationSent: true },
  });

  return {
    total: details.length,
    sent: details.filter((d) => d.status === 'sent').length,
    failed: details.filter((d) => d.status === 'failed').length,
    details,
  };
}

export async function getNotifications(query: {
  teacherId: string;
  sessionId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (query.sessionId) {
    where.sessionId = query.sessionId;
  }
  if (query.status) {
    where.status = query.status;
  }

  // teacherId로 필터링: 세션 → 클래스 → teacherId
  where.session = { class: { teacherId: query.teacherId } };

  const limit = query.limit || 20;
  const offset = query.offset || 0;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return { notifications, total };
}
