import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. 선생님 계정
  const hashedPassword = await bcrypt.hash('test1234', 10);
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@academy.com' },
    update: {},
    create: {
      email: 'teacher@academy.com',
      password: hashedPassword,
      name: '김선생',
      phone: '010-1234-5678',
    },
  });
  console.log(`Teacher created: ${teacher.name} (${teacher.email})`);

  // 1-2. 관리자(원장) 계정
  const adminPassword = await bcrypt.hash('admin1234', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@academy.com' },
    update: {},
    create: {
      email: 'admin@academy.com',
      password: adminPassword,
      name: '관리자',
      phone: '010-0000-0000',
      role: 'principal',
    },
  });
  console.log(`Admin created: ${admin.name} (${admin.email})`);

  // 2. 수업
  const mathClass = await prisma.class.create({
    data: {
      teacherId: teacher.id,
      name: '수학 중3 심화반',
      subject: '수학',
      dayOfWeek: '월,수,금',
      startTime: '17:00',
      endTime: '19:00',
      room: '301호',
      maxStudents: 15,
    },
  });

  const engClass = await prisma.class.create({
    data: {
      teacherId: teacher.id,
      name: '영어 고1 기본반',
      subject: '영어',
      dayOfWeek: '화,목',
      startTime: '19:00',
      endTime: '21:00',
      room: '205호',
      maxStudents: 12,
    },
  });
  console.log(`Classes created: ${mathClass.name}, ${engClass.name}`);

  // 3. 학생 + 학부모
  const students = [
    { name: '김철수', grade: '중3', school: '서울중학교', phone: '010-1111-0001', parentName: '김아무개', parentPhone: '010-2222-0001', parentRel: '부' },
    { name: '이영희', grade: '중3', school: '서울중학교', phone: '010-1111-0002', parentName: '이어머니', parentPhone: '010-2222-0002', parentRel: '모' },
    { name: '박민수', grade: '중3', school: '한강중학교', phone: '010-1111-0003', parentName: '박부모', parentPhone: '010-2222-0003', parentRel: '부' },
    { name: '최지원', grade: '고1', school: '서울고등학교', phone: '010-1111-0004', parentName: '최보호자', parentPhone: '010-2222-0004', parentRel: '모' },
    { name: '강하늘', grade: '고1', school: '서울고등학교', phone: '010-1111-0005', parentName: '강부모', parentPhone: '010-2222-0005', parentRel: '부' },
  ];

  for (const s of students) {
    const student = await prisma.student.create({
      data: {
        name: s.name,
        grade: s.grade,
        school: s.school,
        phone: s.phone,
        teacherId: teacher.id,
        parents: {
          create: { name: s.parentName, phone: s.parentPhone, relationship: s.parentRel },
        },
      },
    });

    // 수학반에 중3 학생, 영어반에 고1 학생 등록
    if (s.grade === '중3') {
      await prisma.classStudent.create({ data: { classId: mathClass.id, studentId: student.id } });
    } else {
      await prisma.classStudent.create({ data: { classId: engClass.id, studentId: student.id } });
    }
  }
  console.log(`Students created: ${students.length}`);

  // 4. 학부모 계정 (김철수의 부모 — 전화번호로 매칭)
  const parentPassword = await bcrypt.hash('parent1234', 10);
  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@test.com' },
    update: {},
    create: {
      email: 'parent@test.com',
      password: parentPassword,
      name: '김아무개',
      phone: '010-2222-0001',
      role: 'parent',
    },
  });
  console.log(`Parent created: ${parentUser.name} (${parentUser.email})`);

  // 5. 학생 계정 (김철수 본인 — 전화번호로 매칭)
  const studentPassword = await bcrypt.hash('student1234', 10);
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@test.com' },
    update: {},
    create: {
      email: 'student@test.com',
      password: studentPassword,
      name: '김철수',
      phone: '010-1111-0001',
      role: 'student',
    },
  });
  console.log(`Student created: ${studentUser.name} (${studentUser.email})`);

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
