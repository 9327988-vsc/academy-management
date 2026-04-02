import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive seed (250 students, 20 teachers)...');

  // 기존 데이터 전부 삭제 (역순)
  await prisma.salaryRecord.deleteMany();
  await prisma.classSchedule.deleteMany();
  await prisma.teacherSchedule.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.homework.deleteMany();
  await prisma.classHomework.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.class.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.student.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ 기존 데이터 삭제 완료');

  const hashedPassword = await bcrypt.hash('test1234', 10);

  // 1. 관리자
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@academy.com',
      password: await bcrypt.hash('admin1234', 10),
      name: '관리자',
      role: 'ADMIN',
      phone: '010-1234-5678',
    },
  });
  console.log('✅ 관리자 생성:', adminUser.name);

  // 2. 강사 20명 (첫 번째는 표준 테스트 계정)
  const teachers = [];
  const subjects = ['수학', '영어', '과학', '국어', '사회'];

  // 표준 테스트 강사
  const teacher1User = await prisma.user.create({
    data: {
      email: 'teacher@academy.com',
      password: hashedPassword,
      name: '선생님',
      role: 'TEACHER',
      phone: '010-2000-0001',
    },
  });
  const teacher1 = await prisma.teacher.create({
    data: {
      userId: teacher1User.id,
      phone: teacher1User.phone!,
      email: teacher1User.email,
      education: '서울대 수학교육과 졸업',
      career: '5년차 경력. 학원 강의 전문.',
      subjects: ['수학', '영어'],
      introduction: '안녕하세요. 수학 전문 강사입니다.',
      employmentType: '정규직',
      salary: 3100000,
    },
  });
  teachers.push(teacher1);

  for (let i = 2; i <= 20; i++) {
    const teacherUser = await prisma.user.create({
      data: {
        email: `teacher${i}@academy.com`,
        password: hashedPassword,
        name: `강사${i}`,
        role: 'TEACHER',
        phone: `010-2000-${String(i).padStart(4, '0')}`,
      },
    });

    const teacher = await prisma.teacher.create({
      data: {
        userId: teacherUser.id,
        phone: teacherUser.phone!,
        email: teacherUser.email,
        education: `${['서울대', '연세대', '고려대', '카이스트'][i % 4]} ${subjects[i % 5]}과 졸업`,
        career: `${(i % 10) + 1}년차 경력. 학원 강의 전문.`,
        subjects: [subjects[i % 5], subjects[(i + 1) % 5]],
        introduction: `안녕하세요. ${subjects[i % 5]} 전문 강사 ${teacherUser.name}입니다.`,
        employmentType: i % 3 === 0 ? '계약직' : '정규직',
        hourlyRate: i % 3 === 0 ? 50000 : null,
        salary: i % 3 !== 0 ? 3000000 + (i * 100000) : null,
      },
    });

    teachers.push(teacher);
  }
  console.log(`✅ 강사 20명 생성`);

  // 3. 학부모 50명 (첫 번째는 표준 테스트 계정)
  const parents = [];

  // 표준 테스트 학부모
  const parent1User = await prisma.user.create({
    data: {
      email: 'parent@test.com',
      password: await bcrypt.hash('parent1234', 10),
      name: '학부모',
      role: 'PARENT',
      phone: '010-3000-0001',
    },
  });
  const parent1 = await prisma.parent.create({
    data: {
      userId: parent1User.id,
      name: parent1User.name,
      phone: parent1User.phone!,
      email: parent1User.email,
      relation: '모',
    },
  });
  parents.push(parent1);

  for (let i = 2; i <= 50; i++) {
    const parentUser = await prisma.user.create({
      data: {
        email: `parent${i}@test.com`,
        password: hashedPassword,
        name: `학부모${i}`,
        role: 'PARENT',
        phone: `010-3000-${String(i).padStart(4, '0')}`,
      },
    });

    const parent = await prisma.parent.create({
      data: {
        userId: parentUser.id,
        name: parentUser.name,
        phone: parentUser.phone!,
        email: parentUser.email,
        relation: i % 2 === 0 ? '부' : '모',
      },
    });

    parents.push(parent);
  }
  console.log(`✅ 학부모 50명 생성`);

  // 4. 학생 250명 (첫 번째는 표준 테스트 계정)
  const students = [];
  const grades = ['초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'];

  // 표준 테스트 학생
  const student1User = await prisma.user.create({
    data: {
      email: 'student@test.com',
      password: await bcrypt.hash('student1234', 10),
      name: '학생',
      role: 'STUDENT',
      phone: '010-4000-0001',
    },
  });
  const student1 = await prisma.student.create({
    data: {
      userId: student1User.id,
      name: student1User.name,
      phone: student1User.phone!,
      grade: '중1',
      school: '서울중학교',
      parentId: parent1.id,
      status: 'ACTIVE',
    },
  });
  students.push(student1);

  for (let i = 2; i <= 250; i++) {
    const studentUser = await prisma.user.create({
      data: {
        email: `student${i}@test.com`,
        password: hashedPassword,
        name: `학생${i}`,
        role: 'STUDENT',
        phone: `010-4000-${String(i).padStart(4, '0')}`,
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        name: studentUser.name,
        phone: studentUser.phone!,
        grade: grades[i % grades.length],
        school: `서울${['초', '중', '고'][Math.floor((i % grades.length) / 3)]}등학교`,
        parentId: parents[Math.floor((i - 1) / 5)].id,
        status: 'ACTIVE',
      },
    });

    students.push(student);
  }
  console.log(`✅ 학생 250명 생성`);

  // 5. 수업 40개 (강사당 2개)
  const classes = [];
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 2; j++) {
      const cls = await prisma.class.create({
        data: {
          name: `${subjects[i % 5]} ${grades[(i + j) % grades.length]} ${j === 0 ? '기본반' : '심화반'}`,
          subject: subjects[i % 5],
          teacherId: teachers[i].id,
          schedule: j === 0 ? '월수금 16:00-18:00' : '화목 16:00-18:00',
          startDate: new Date('2026-03-01'),
          endDate: new Date('2026-08-31'),
          room: `${Math.floor(i / 4) + 1}층 ${(i % 4) + 1}호`,
          capacity: 15,
          tuitionFee: 300000 + (j * 50000),
          status: 'ACTIVE',
        },
      });

      classes.push(cls);
    }
  }
  console.log(`✅ 수업 40개 생성`);

  // 6. 수강 신청 (학생당 2-3개)
  let enrollmentCount = 0;
  for (let i = 0; i < students.length; i++) {
    const numClasses = Math.floor(Math.random() * 2) + 2;
    for (let j = 0; j < numClasses; j++) {
      const cls = classes[(i * 3 + j) % classes.length];

      await prisma.enrollment.create({
        data: {
          studentId: students[i].id,
          classId: cls.id,
          status: 'ACTIVE',
          tuitionFee: cls.tuitionFee,
          discount: Math.random() > 0.7 ? 30000 : 0,
          finalFee: cls.tuitionFee - (Math.random() > 0.7 ? 30000 : 0),
        },
      });
      enrollmentCount++;
    }
  }
  console.log(`✅ 수강 신청 ${enrollmentCount}개 생성`);

  // 7. 출석 기록 (최근 2주, 샘플)
  let attendanceCount = 0;
  for (let day = 0; day < 14; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);

    for (let i = 0; i < Math.min(50, students.length); i++) {
      const student = students[i];
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: student.id },
        take: 1,
      });

      if (enrollments.length > 0) {
        await prisma.attendance.create({
          data: {
            studentId: student.id,
            classId: enrollments[0].classId,
            date: date,
            status: Math.random() > 0.1 ? 'PRESENT' : (Math.random() > 0.5 ? 'LATE' : 'ABSENT'),
            checkInTime: new Date(date.setHours(16, 0, 0)),
            recordedBy: `강사${(i % 20) + 1}`,
          },
        });
        attendanceCount++;
      }
    }
  }
  console.log(`✅ 출석 기록 ${attendanceCount}개 생성`);

  // 8. 결제 기록 (이번 달)
  for (let i = 0; i < students.length; i++) {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: students[i].id },
    });

    if (enrollments.length > 0) {
      const totalFee = enrollments.reduce((sum, e) => sum + e.finalFee, 0);

      await prisma.payment.create({
        data: {
          studentId: students[i].id,
          amount: totalFee,
          dueDate: new Date('2026-03-05'),
          paidDate: Math.random() > 0.2 ? new Date('2026-03-03') : null,
          status: Math.random() > 0.2 ? 'PAID' : 'PENDING',
          month: '2026-03',
          method: ['카드', '현금', '계좌이체'][Math.floor(Math.random() * 3)],
        },
      });
    }
  }
  console.log(`✅ 결제 기록 250개 생성`);

  console.log('\n=== Seed 완료 ===');
  console.log('📊 생성된 데이터:');
  console.log(`- 관리자: 1명`);
  console.log(`- 강사: 20명`);
  console.log(`- 학부모: 50명`);
  console.log(`- 학생: 250명`);
  console.log(`- 수업: 40개`);
  console.log(`- 수강 신청: ${enrollmentCount}개`);
  console.log(`- 출석 기록: ${attendanceCount}개`);
  console.log(`- 결제 기록: 250개`);
}

main()
  .catch((e) => {
    console.error('❌ Seed 에러:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
