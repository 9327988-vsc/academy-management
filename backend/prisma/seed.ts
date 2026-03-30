import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 기존 데이터 정리 (FK 의존 순서대로 삭제)
  await prisma.notification.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.classSession.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.classStudent.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.systemLog.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ 기존 데이터 정리 완료');

  // 1. 비밀번호 해싱
  const [teacherPw, adminPw, parentPw, studentPw] = await Promise.all([
    bcrypt.hash('test1234', 10),
    bcrypt.hash('admin1234', 10),
    bcrypt.hash('parent1234', 10),
    bcrypt.hash('student1234', 10),
  ]);

  // 2. 사용자 계정 생성
  const teacher = await prisma.user.create({
    data: { email: 'teacher@academy.com', password: teacherPw, name: '김선생', phone: '010-1234-5678', role: 'teacher' },
  });

  const admin = await prisma.user.create({
    data: { email: 'admin@academy.com', password: adminPw, name: '관리자', phone: '010-0000-0000', role: 'principal' },
  });

  const parentUser = await prisma.user.create({
    data: { email: 'parent@test.com', password: parentPw, name: '김아무개', phone: '010-2222-0001', role: 'parent' },
  });

  const studentUser = await prisma.user.create({
    data: { email: 'student@test.com', password: studentPw, name: '김철수', phone: '010-1111-0001', role: 'student' },
  });

  console.log(`✅ 계정 생성: ${teacher.email}, ${admin.email}, ${parentUser.email}, ${studentUser.email}`);

  // 3. 수업 생성
  const mathClass = await prisma.class.create({
    data: { teacherId: teacher.id, name: '수학 중3 심화반', subject: '수학', dayOfWeek: '월,수,금', startTime: '17:00', endTime: '19:00', room: '301호', maxStudents: 15 },
  });

  const engClass = await prisma.class.create({
    data: { teacherId: teacher.id, name: '영어 고1 기본반', subject: '영어', dayOfWeek: '화,목', startTime: '19:00', endTime: '21:00', room: '205호', maxStudents: 12 },
  });
  console.log(`✅ 수업 생성: ${mathClass.name}, ${engClass.name}`);

  // 4. 학생 + 학부모 데이터 (전화번호 매칭이 핵심)
  const studentsData = [
    // 김철수: phone이 studentUser.phone과 동일, 학부모 phone이 parentUser.phone과 동일
    { name: '김철수', grade: '중3', school: '서울중학교', phone: '010-1111-0001', parentName: '김아무개', parentPhone: '010-2222-0001', parentRel: '부' },
    { name: '이영희', grade: '중3', school: '서울중학교', phone: '010-1111-0002', parentName: '이어머니', parentPhone: '010-2222-0002', parentRel: '모' },
    { name: '박민수', grade: '중3', school: '한강중학교', phone: '010-1111-0003', parentName: '박부모', parentPhone: '010-2222-0003', parentRel: '부' },
    { name: '최지원', grade: '고1', school: '서울고등학교', phone: '010-1111-0004', parentName: '최보호자', parentPhone: '010-2222-0004', parentRel: '모' },
    { name: '강하늘', grade: '고1', school: '서울고등학교', phone: '010-1111-0005', parentName: '강부모', parentPhone: '010-2222-0005', parentRel: '부' },
  ];

  const createdStudents = [];
  for (const s of studentsData) {
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
    createdStudents.push(student);

    // 중3 → 수학반, 고1 → 영어반
    const classId = s.grade === '중3' ? mathClass.id : engClass.id;
    await prisma.classStudent.create({ data: { classId, studentId: student.id } });
  }
  console.log(`✅ 학생 ${createdStudents.length}명 생성 + 수업 등록 완료`);

  // 5. 샘플 수업 세션 생성 (출석 기록의 전제)
  const today = new Date();
  const sessions = [];
  for (let i = 0; i < 5; i++) {
    const sessionDate = new Date(today);
    sessionDate.setDate(today.getDate() - (i * 2 + 1));

    const session = await prisma.classSession.create({
      data: {
        classId: mathClass.id,
        sessionDate,
        startTime: '17:00',
        endTime: '19:00',
        topic: `수학 ${i + 1}회차 수업`,
      },
    });
    sessions.push(session);
  }
  console.log(`✅ 수업 세션 ${sessions.length}개 생성`);

  // 6. 김철수 출석 기록 생성 (student@test.com에서 확인 가능)
  const kimStudent = createdStudents[0]; // 김철수
  const statuses: Array<'present' | 'late' | 'absent'> = ['present', 'present', 'present', 'late', 'absent'];
  for (let i = 0; i < sessions.length; i++) {
    await prisma.attendance.create({
      data: {
        sessionId: sessions[i].id,
        studentId: kimStudent.id,
        status: statuses[i],
      },
    });
  }
  console.log(`✅ 김철수 출석 기록 ${sessions.length}건 생성 (출석3, 지각1, 결석1)`);

  // 7. 샘플 공지사항
  await prisma.announcement.create({
    data: { title: '3월 신학기 안내', content: '3월 2일부터 새 학기 수업이 시작됩니다. 교재를 준비해 주세요.', important: true, authorId: admin.id },
  });
  await prisma.announcement.create({
    data: { title: '수업료 납부 안내', content: '이번 달 수업료는 3월 10일까지 납부 부탁드립니다.', important: false, authorId: admin.id },
  });
  console.log('✅ 공지사항 2건 생성');

  // 8. 샘플 결제 데이터
  for (const student of createdStudents) {
    await prisma.payment.create({
      data: { studentId: student.id, amount: 300000, month: '2026-03', status: student.name === '김철수' ? 'paid' : 'unpaid', paidAt: student.name === '김철수' ? new Date() : null, description: '수학/영어 수업료' },
    });
  }
  console.log(`✅ 결제 데이터 ${createdStudents.length}건 생성`);

  // 9. 테스트용 부모2 + 학생2 (연결된 계정)
  const parentUser2 = await prisma.user.create({
    data: { email: 'parent2@test.com', password: parentPw, name: '이학부모', phone: '010-5555-6666', role: 'parent' },
  });
  console.log(`✅ 테스트 부모2 생성: ${parentUser2.email}`);

  const student2 = await prisma.student.create({
    data: {
      name: '이학생',
      phone: '010-7777-8888',
      grade: '중2',
      school: '테스트중학교',
      teacherId: teacher.id,
      parents: {
        create: { name: '이학부모', phone: '010-5555-6666', relationship: '모' },
      },
    },
  });

  const studentUser2 = await prisma.user.create({
    data: { email: 'student2@test.com', password: studentPw, name: '이학생', phone: '010-7777-8888', role: 'student' },
  });
  console.log(`✅ 테스트 학생2 생성: ${studentUser2.email} → 부모: ${parentUser2.name}`);

  // 학생2를 수학 수업에 등록
  await prisma.classStudent.create({ data: { classId: mathClass.id, studentId: student2.id } });
  console.log(`✅ 테스트 학생2 수업 등록: ${mathClass.name}`);

  // 검증 로그
  console.log('\n📋 매칭 검증:');
  console.log(`  parent@test.com (phone: ${parentUser.phone}) → Parent.phone: 010-2222-0001 → 학생: 김철수`);
  console.log(`  student@test.com (phone: ${studentUser.phone}) → Student.phone: 010-1111-0001 → 학생: 김철수`);
  console.log(`  parent2@test.com (phone: ${parentUser2.phone}) → Parent.phone: 010-5555-6666 → 학생: 이학생`);
  console.log(`  student2@test.com (phone: ${studentUser2.phone}) → Student.phone: 010-7777-8888 → 학생: 이학생`);
  console.log('\n🌱 Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
