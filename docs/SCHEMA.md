# SCHEMA.md — DB 스키마 설계서 (확정)

**프로젝트:** Academy Smart Management System (ASMS)
**작성일:** 2026-03-28
**단계:** Phase 3 디자인 (BE)
**담당:** Schema Design Agent

---

## 1. Prisma Schema (확정본)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ──────────────────────────────────────
// 1. 사용자 (선생님)
// ──────────────────────────────────────
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  phone     String
  role      Role     @default(teacher)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  classes  Class[]
  students Student[]

  @@index([email])
  @@map("users")
}

enum Role {
  teacher
}

// ──────────────────────────────────────
// 2. 수업
// ──────────────────────────────────────
model Class {
  id          String   @id @default(uuid())
  teacherId   String   @map("teacher_id")
  name        String
  subject     String
  dayOfWeek   String   @map("day_of_week") // "월,수,금"
  startTime   String   @map("start_time")  // "17:00"
  endTime     String   @map("end_time")    // "19:00"
  room        String?
  maxStudents Int      @default(15) @map("max_students")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  teacher  User           @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  students ClassStudent[]
  sessions ClassSession[]

  @@index([teacherId])
  @@map("classes")
}

// ──────────────────────────────────────
// 3. 학생
// ──────────────────────────────────────
model Student {
  id        String   @id @default(uuid())
  name      String
  phone     String?
  grade     String?
  school    String?
  teacherId String   @map("teacher_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  teacher    User           @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  parents    Parent[]
  classes    ClassStudent[]
  attendance Attendance[]

  @@index([teacherId])
  @@map("students")
}

// ──────────────────────────────────────
// 4. 학부모
// ──────────────────────────────────────
model Parent {
  id           String   @id @default(uuid())
  studentId    String   @map("student_id")
  name         String
  phone        String
  relationship String?
  createdAt    DateTime @default(now()) @map("created_at")

  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([studentId])
  @@map("parents")
}

// ──────────────────────────────────────
// 5. 수강 연결 (수업 ↔ 학생)
// ──────────────────────────────────────
model ClassStudent {
  id         String   @id @default(uuid())
  classId    String   @map("class_id")
  studentId  String   @map("student_id")
  enrolledAt DateTime @default(now()) @map("enrolled_at")

  class   Class   @relation(fields: [classId], references: [id], onDelete: Cascade)
  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([classId, studentId], name: "unique_enrollment")
  @@index([classId])
  @@index([studentId])
  @@map("class_students")
}

// ──────────────────────────────────────
// 6. 수업 세션 (실제 진행 기록)
// ──────────────────────────────────────
model ClassSession {
  id               String    @id @default(uuid())
  classId          String    @map("class_id")
  sessionDate      DateTime  @map("session_date") @db.Date
  startTime        String    @map("start_time")
  endTime          String    @map("end_time")
  topic            String?
  textbook         String?
  pages            String?
  keyConcepts      String?   @map("key_concepts") @db.Text
  homework         String?   @db.Text
  homeworkDueDate  DateTime? @map("homework_due_date") @db.Date
  nextTopic        String?   @map("next_topic")
  specialNotes     String?   @map("special_notes") @db.Text
  notificationSent Boolean   @default(false) @map("notification_sent")
  createdAt        DateTime  @default(now()) @map("created_at")

  class         Class          @relation(fields: [classId], references: [id], onDelete: Cascade)
  attendance    Attendance[]
  notifications Notification[]

  @@index([classId, sessionDate])
  @@index([notificationSent])
  @@map("class_sessions")
}

// ──────────────────────────────────────
// 7. 출석 기록
// ──────────────────────────────────────
model Attendance {
  id        String           @id @default(uuid())
  sessionId String           @map("session_id")
  studentId String           @map("student_id")
  status    AttendanceStatus
  checkTime DateTime         @default(now()) @map("check_time")
  notes     String?          @db.Text

  session ClassSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  student Student      @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([sessionId, studentId], name: "unique_attendance")
  @@index([sessionId])
  @@index([studentId])
  @@index([status])
  @@map("attendance")
}

enum AttendanceStatus {
  present
  absent
  late
}

// ──────────────────────────────────────
// 8. 알림 발송 로그
// ──────────────────────────────────────
model Notification {
  id             String             @id @default(uuid())
  sessionId      String             @map("session_id")
  recipientPhone String             @map("recipient_phone")
  recipientName  String             @map("recipient_name")
  recipientType  RecipientType      @map("recipient_type")
  content        String             @db.Text
  status         NotificationStatus @default(pending)
  sentAt         DateTime?          @map("sent_at")
  errorMessage   String?            @map("error_message") @db.Text
  createdAt      DateTime           @default(now()) @map("created_at")

  session ClassSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
  @@index([status])
  @@index([sentAt])
  @@map("notifications")
}

enum RecipientType {
  student
  parent
}

enum NotificationStatus {
  pending
  sent
  failed
}
```

---

## 2. 엔티티 관계 (확정)

```
User (1) ──→ (N) Class (1) ──→ (N) ClassSession (1) ──→ (N) Attendance
  │                 │                    │                       ↑
  │                 │                    └──→ (N) Notification   │
  │                 │                                            │
  │                 └──→ (M:N) Student ──────────────────────────┘
  │                  via ClassStudent      │
  └──→ (N) Student                         └──→ (N) Parent
```

---

## 3. 인덱스 전략

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| users | `idx_email(email)` | 로그인 시 이메일 조회 |
| classes | `idx_teacher(teacher_id)` | 선생님별 수업 목록 |
| students | `idx_teacher(teacher_id)` | 선생님별 학생 목록 |
| parents | `idx_student(student_id)` | 학생별 학부모 조회 |
| class_students | `idx_class(class_id)`, `idx_student(student_id)` | 수업별/학생별 조회 |
| class_sessions | `idx_class_date(class_id, session_date)` | 수업+날짜 복합 조회 |
| class_sessions | `idx_notification_sent(notification_sent)` | 미발송 알림 필터 |
| attendance | `idx_session(session_id)`, `idx_student(student_id)` | 세션별/학생별 출석 |
| attendance | `idx_status(status)` | 출석 상태별 필터 |
| notifications | `idx_session(session_id)`, `idx_status(status)` | 세션별/상태별 조회 |

---

## 4. 보안 설계

### 인증

| 항목 | 설계 |
|------|------|
| 방식 | JWT (Access + Refresh Token) |
| Access Token | 15분 만료, HS256, Payload: {userId, email, role} |
| Refresh Token | 7일 만료, DB 저장 없음 (stateless) |
| 비밀번호 | bcrypt 해싱, saltRounds: 10 |
| 전송 | Authorization: Bearer {token} |

### 데이터 접근 제어

```
모든 API에서 teacherId 기준 필터링:
- GET /classes     → WHERE teacherId = 로그인 유저 ID
- GET /students    → WHERE teacherId = 로그인 유저 ID
- 타인의 리소스 접근 시 → 403 Forbidden
```

### 민감 데이터 보호

| 데이터 | 보호 방식 |
|--------|-----------|
| 비밀번호 | bcrypt 해시 (평문 저장 금지) |
| 전화번호 | DB 저장 시 평문, API 응답에서는 마스킹 불필요 (선생님 본인 데이터) |
| JWT Secret | 환경변수(.env) 관리, 코드에 하드코딩 금지 |

### Rate Limiting

| 엔드포인트 | 제한 |
|-----------|------|
| POST /auth/login | 5회/분 (브루트포스 방지) |
| POST /auth/register | 3회/분 |
| POST /sessions/:id/send-notification | 1회/분 (중복 발송 방지) |
| 기타 API | 100회/분 |

### 입력 검증 (express-validator)

| 필드 | 규칙 |
|------|------|
| email | isEmail(), trim() |
| password | isLength({min: 8}), matches(/^(?=.*[a-zA-Z])(?=.*\d)/) |
| name | isLength({min: 1, max: 50}), trim() |
| phone | matches(/^01[016789]-?\d{3,4}-?\d{4}$/) |
| subject | isLength({min: 1, max: 50}) |
| dayOfWeek | matches(/^[월화수목금토일](,[월화수목금토일])*$/) |

---

## 5. 시드 데이터

```typescript
// prisma/seed.ts — 개발용 초기 데이터

const seedData = {
  user: {
    email: "teacher@academy.com",
    password: "test1234", // bcrypt 해싱 후 저장
    name: "김선생",
    phone: "010-1234-5678",
    role: "teacher"
  },
  classes: [
    {
      name: "수학 중3 심화반",
      subject: "수학",
      dayOfWeek: "월,수,금",
      startTime: "17:00",
      endTime: "19:00",
      room: "301호",
      maxStudents: 15
    },
    {
      name: "영어 고1 기본반",
      subject: "영어",
      dayOfWeek: "화,목",
      startTime: "19:00",
      endTime: "21:00",
      room: "205호",
      maxStudents: 12
    }
  ],
  students: [
    { name: "김철수", grade: "중3", school: "서울중학교", phone: "010-1111-0001" },
    { name: "이영희", grade: "중3", school: "서울중학교", phone: "010-1111-0002" },
    { name: "박민수", grade: "중3", school: "한강중학교", phone: "010-1111-0003" },
    { name: "최지원", grade: "고1", school: "서울고등학교", phone: "010-1111-0004" },
    { name: "강하늘", grade: "고1", school: "서울고등학교", phone: "010-1111-0005" }
  ]
};
```
