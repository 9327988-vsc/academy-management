import prisma from '../utils/prisma';
import bcrypt from 'bcrypt';

interface CreateUserWithDataInput {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: string;
  grade?: string;
  school?: string;
  parentPhone?: string;
}

export async function createUserWithData(input: CreateUserWithDataInput) {
  const { email, password, name, phone, role, grade, school, parentPhone } = input;

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      phone,
      role: role as any,
    },
  });

  let additionalData: any = null;
  let warning: string | undefined;

  if (role === 'student') {
    // 부모 전화번호로 Parent 찾기
    let parentId: string | null = null;
    if (parentPhone) {
      const parent = await prisma.parent.findFirst({
        where: { phone: parentPhone },
      });
      if (parent) {
        parentId = parent.studentId; // 참고용 — 실제로는 새 Parent 레코드 필요 없음
      }
    }

    // teacherId 필수 — 첫 번째 teacher를 기본값으로 사용
    const teacher = await prisma.user.findFirst({ where: { role: 'teacher' } });
    if (!teacher) {
      throw new Error('선생님 계정이 없어 학생을 생성할 수 없습니다.');
    }

    const student = await prisma.student.create({
      data: {
        name,
        phone,
        grade: grade || '',
        school: school || '',
        teacherId: teacher.id,
      },
    });
    additionalData = student;

    // 부모 전화번호로 기존 Parent의 학부모 User 찾아서 연결
    if (parentPhone) {
      const parentRecord = await prisma.parent.findFirst({
        where: { phone: parentPhone },
      });
      if (parentRecord) {
        // 같은 부모를 이 학생에게도 연결
        await prisma.parent.create({
          data: {
            name: parentRecord.name,
            phone: parentRecord.phone,
            relationship: parentRecord.relationship,
            studentId: student.id,
          },
        });
      } else {
        warning = `전화번호 ${parentPhone}로 등록된 부모를 찾을 수 없습니다. 나중에 연결해주세요.`;
      }
    }
  }

  if (role === 'parent') {
    // Parent 레코드는 학생이 생성될 때 연결됨
    // 여기서는 User 계정만 생성 (phone으로 나중에 매칭)
    additionalData = { note: '학생 생성 시 전화번호로 자동 연결됩니다.' };
  }

  return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, additionalData, warning };
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return users;
}

export async function updateUserRole(userId: string, role: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: role as any },
    select: { id: true, name: true, email: true, role: true },
  });
  return user;
}

export async function deleteUser(userId: string) {
  await prisma.user.delete({ where: { id: userId } });
}

// --- Dev Mode: 첫 번째 학생/부모 데이터로 대시보드 반환 ---

export async function getDevStudentDashboard() {
  // 출석 기록이 있는 첫 번째 학생 찾기
  const student = await prisma.student.findFirst({
    where: { attendance: { some: {} } },
    include: {
      classes: {
        include: {
          class: { select: { id: true, name: true, subject: true, dayOfWeek: true, startTime: true, endTime: true, room: true } },
        },
      },
      attendance: {
        orderBy: { checkTime: 'desc' },
        take: 30,
        include: {
          session: { select: { sessionDate: true, class: { select: { name: true } } } },
        },
      },
    },
  });

  if (!student) {
    // 출석 기록이 없으면 아무 학생이나
    const anyStudent = await prisma.student.findFirst({
      include: {
        classes: {
          include: {
            class: { select: { id: true, name: true, subject: true, dayOfWeek: true, startTime: true, endTime: true, room: true } },
          },
        },
      },
    });
    if (!anyStudent) return null;

    return {
      name: anyStudent.name,
      grade: anyStudent.grade,
      school: anyStudent.school,
      attendanceRate: 0,
      stats: { total: 0, present: 0, late: 0, absent: 0 },
      classes: anyStudent.classes.map((cs) => ({
        id: cs.class.id, name: cs.class.name, subject: cs.class.subject,
        dayOfWeek: cs.class.dayOfWeek, startTime: cs.class.startTime, endTime: cs.class.endTime, room: cs.class.room,
      })),
      recentAttendance: [],
    };
  }

  const totalAttendance = student.attendance.length;
  const presentCount = student.attendance.filter((a) => a.status === 'present').length;
  const lateCount = student.attendance.filter((a) => a.status === 'late').length;
  const absentCount = student.attendance.filter((a) => a.status === 'absent').length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  return {
    name: student.name,
    grade: student.grade,
    school: student.school,
    attendanceRate,
    stats: { total: totalAttendance, present: presentCount, late: lateCount, absent: absentCount },
    classes: student.classes.map((cs) => ({
      id: cs.class.id, name: cs.class.name, subject: cs.class.subject,
      dayOfWeek: cs.class.dayOfWeek, startTime: cs.class.startTime, endTime: cs.class.endTime, room: cs.class.room,
    })),
    recentAttendance: student.attendance.slice(0, 15).map((a) => ({
      date: a.session.sessionDate,
      className: a.session.class.name,
      status: a.status,
    })),
  };
}

export async function getDevParentChildren() {
  // 자녀가 있는 첫 번째 부모 phone 찾기
  const parentRecord = await prisma.parent.findFirst({
    include: {
      student: {
        include: {
          classes: {
            include: {
              class: { select: { id: true, name: true, subject: true, dayOfWeek: true, startTime: true, endTime: true } },
            },
          },
          attendance: {
            orderBy: { checkTime: 'desc' },
            take: 20,
            include: {
              session: { select: { sessionDate: true, class: { select: { name: true } } } },
            },
          },
        },
      },
    },
  });

  if (!parentRecord) return [];

  // 같은 phone의 모든 Parent 레코드 가져오기 (여러 자녀)
  const allParentRecords = await prisma.parent.findMany({
    where: { phone: parentRecord.phone },
    include: {
      student: {
        include: {
          classes: {
            include: {
              class: { select: { id: true, name: true, subject: true, dayOfWeek: true, startTime: true, endTime: true } },
            },
          },
          attendance: {
            orderBy: { checkTime: 'desc' },
            take: 20,
            include: {
              session: { select: { sessionDate: true, class: { select: { name: true } } } },
            },
          },
        },
      },
    },
  });

  return allParentRecords.map((p) => {
    const s = p.student;
    const totalAttendance = s.attendance.length;
    const presentCount = s.attendance.filter((a) => a.status === 'present').length;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    return {
      id: s.id, name: s.name, grade: s.grade, school: s.school, phone: s.phone,
      attendanceRate, totalClasses: totalAttendance,
      classes: s.classes.map((cs) => ({
        id: cs.class.id, name: cs.class.name, subject: cs.class.subject,
        dayOfWeek: cs.class.dayOfWeek, startTime: cs.class.startTime, endTime: cs.class.endTime,
      })),
      recentAttendance: s.attendance.slice(0, 10).map((a) => ({
        date: a.session.sessionDate,
        className: a.session.class.name,
        status: a.status,
      })),
    };
  });
}

export async function getSystemStats() {
  const [userCount, classCount, studentCount, sessionCount] = await Promise.all([
    prisma.user.count(),
    prisma.class.count(),
    prisma.student.count(),
    prisma.classSession.count(),
  ]);

  const usersByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: true,
  });

  return {
    users: userCount,
    classes: classCount,
    students: studentCount,
    sessions: sessionCount,
    usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count })),
  };
}
