# SCHEMA_V2_MAKEUP.md — 보강 시스템 + 알림 확장 설계서

**프로젝트:** Academy Smart Management System (ASMS)
**작성일:** 2026-04-02
**단계:** Phase 1 상용화 — Schema Design
**담당:** Schema Design Agent
**기반 스키마:** `backend/prisma/schema.prisma` (Int autoincrement PK, RBAC 4역할)

---

## 0. 설계 원칙

1. 기존 19개 테이블의 PK 체계(Int autoincrement)를 유지한다.
2. 새 테이블도 동일한 컨벤션(camelCase 컬럼, PascalCase 모델)을 따른다.
3. 기존 Attendance 테이블의 `status = ABSENT | EXCUSED`인 레코드가 보강 신청의 기준이 된다.
4. Notification 테이블은 기존 구조를 확장하되, 하위 호환을 깨지 않는다.

---

## 1. 신규 Enum 정의

```prisma
enum MakeupSlotStatus {
  AVAILABLE
  FULL
  CLOSED
}

enum MakeupRequestStatus {
  PENDING
  APPROVED
  REJECTED
  COMPLETED
  CANCELLED
}

enum NotificationChannel {
  SMS
  KAKAO
  PUSH
  EMAIL
}

enum NotificationTemplateType {
  SESSION_SUMMARY
  ABSENT_NOTICE
  MAKEUP_REMINDER
  MAKEUP_CONFIRMED
  MAKEUP_REJECTED
  WEEKLY_REPORT
  GENERAL
}
```

---

## 2. 신규 엔티티 정의

### 2-1. MakeupSlot (보강 가능 시간)

강사가 보강 가능한 시간대를 등록한다. 특정 수업에 한정하거나, 전체 수업 대상으로 열 수 있다.

```prisma
model MakeupSlot {
  id            Int              @id @default(autoincrement())
  teacherId     Int
  teacher       Teacher          @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  classId       Int?
  class         Class?           @relation(fields: [classId], references: [id], onDelete: SetNull)
  slotDate      DateTime         @db.Date
  startTime     String           // "14:00"
  endTime       String           // "16:00"
  maxStudents   Int              @default(3)
  currentCount  Int              @default(0)
  status        MakeupSlotStatus @default(AVAILABLE)
  isRecurring   Boolean          @default(false)
  recurringDay  String?          // "수" — 매주 반복 시 요일
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  requests MakeupRequest[]

  @@index([teacherId])
  @@index([classId])
  @@index([slotDate])
  @@index([status])
  @@index([teacherId, slotDate, status])
}
```

**필드 설명:**

| 필드 | 설명 |
|------|------|
| classId | null이면 해당 강사의 모든 수업 학생이 신청 가능 |
| maxStudents | 보강 슬롯당 최대 수용 인원 (기본 3명) |
| currentCount | 승인된 신청 수. APPROVED/COMPLETED 상태의 request 수와 동기화 |
| isRecurring | true면 매주 recurringDay에 자동 생성 대상 |
| recurringDay | "월" ~ "일". isRecurring=true일 때 필수 |

### 2-2. MakeupRequest (보강 신청)

학생(또는 학부모)이 결석 출석 기록을 기반으로 보강을 신청한다.

```prisma
model MakeupRequest {
  id                     Int                 @id @default(autoincrement())
  studentId              Int
  student                Student             @relation(fields: [studentId], references: [id], onDelete: Cascade)
  originalAttendanceId   Int
  originalAttendance     Attendance          @relation(fields: [originalAttendanceId], references: [id], onDelete: Restrict)
  slotId                 Int
  slot                   MakeupSlot          @relation(fields: [slotId], references: [id], onDelete: Cascade)
  status                 MakeupRequestStatus @default(PENDING)
  studentNote            String?             @db.Text
  teacherNote            String?             @db.Text
  requestedAt            DateTime            @default(now())
  approvedAt             DateTime?
  completedAt            DateTime?
  createdAt              DateTime            @default(now())
  updatedAt              DateTime            @updatedAt

  @@unique([studentId, originalAttendanceId])
  @@index([studentId])
  @@index([slotId])
  @@index([status])
  @@index([originalAttendanceId])
}
```

**필드 설명:**

| 필드 | 설명 |
|------|------|
| originalAttendanceId | ABSENT 또는 EXCUSED 상태인 출석 레코드. onDelete: Restrict로 보호 |
| unique constraint | 동일 결석에 대해 학생당 1건만 신청 가능 |
| status 흐름 | PENDING → APPROVED → COMPLETED 또는 PENDING → REJECTED 또는 *→ CANCELLED |

### 2-3. NotificationTemplate (알림 템플릿)

다양한 알림 유형에 대한 템플릿을 관리한다. 카카오 알림톡 템플릿 코드 연동도 지원한다.

```prisma
model NotificationTemplate {
  id           Int                      @id @default(autoincrement())
  type         NotificationTemplateType
  channel      NotificationChannel
  name         String                   // 표시명: "보강 승인 알림"
  templateCode String?                  // 카카오 알림톡 템플릿 코드
  content      String                   @db.Text  // "{{studentName}}님의 보강이 {{date}} {{time}}에 확정되었습니다."
  variables    Json?                    // ["studentName", "date", "time"]
  isActive     Boolean                  @default(true)
  createdAt    DateTime                 @default(now())
  updatedAt    DateTime                 @updatedAt

  notifications Notification[]

  @@index([type, channel])
  @@index([isActive])
}
```

**변수 치환 규칙:**

| 변수 | 설명 |
|------|------|
| `{{studentName}}` | 학생 이름 |
| `{{className}}` | 수업 이름 |
| `{{date}}` | 날짜 (YYYY-MM-DD) |
| `{{time}}` | 시간 (HH:mm) |
| `{{teacherName}}` | 강사 이름 |
| `{{reason}}` | 사유 (거절 사유 등) |

### 2-4. NotificationPreference (알림 수신 설정)

사용자별, 알림 유형별 수신 채널 선호도를 저장한다.

```prisma
model NotificationPreference {
  id               Int     @id @default(autoincrement())
  userId           Int
  user             User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  notificationType String  // "SESSION_SUMMARY", "MAKEUP_REMINDER" 등
  channelSms       Boolean @default(true)
  channelKakao     Boolean @default(true)
  channelPush      Boolean @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@unique([userId, notificationType])
  @@index([userId])
}
```

---

## 3. 기존 테이블 수정

### 3-1. Notification 테이블 확장

기존 필드를 유지하면서 3개 컬럼을 추가한다.

```prisma
model Notification {
  // --- 기존 필드 (변경 없음) ---
  id             Int                @id @default(autoincrement())
  sessionId      String             @map("session_id")
  recipientPhone String             @map("recipient_phone")
  recipientName  String             @map("recipient_name")
  recipientType  RecipientType      @map("recipient_type")
  content        String             @db.Text
  status         NotificationStatus @default(pending)
  sentAt         DateTime?          @map("sent_at")
  errorMessage   String?            @map("error_message") @db.Text
  createdAt      DateTime           @default(now()) @map("created_at")

  // --- 신규 필드 ---
  channel        NotificationChannel?   // null = 레거시 SMS (하위호환)
  templateId     Int?
  template       NotificationTemplate?  @relation(fields: [templateId], references: [id], onDelete: SetNull)
  scheduledAt    DateTime?              // null = 즉시 발송

  session ClassSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
  @@index([status])
  @@index([sentAt])
  @@index([templateId])
  @@index([scheduledAt])
  @@map("notifications")
}
```

**하위호환 전략:**
- `channel`은 nullable. 기존 레코드는 null이며, 조회 시 null을 SMS로 취급한다.
- `templateId`는 nullable. 기존 레코드는 하드코딩 content를 그대로 사용한다.
- `scheduledAt`는 nullable. null이면 즉시 발송으로 취급한다.

### 3-2. Attendance 테이블 — 관계 추가

기존 필드 변경 없이, MakeupRequest와의 역방향 관계만 추가한다.

```prisma
model Attendance {
  // ... 기존 필드 모두 유지 ...

  makeupRequests MakeupRequest[]  // 신규: 역방향 관계
}
```

### 3-3. Teacher 테이블 — 관계 추가

```prisma
model Teacher {
  // ... 기존 필드 모두 유지 ...

  makeupSlots MakeupSlot[]  // 신규: 역방향 관계
}
```

### 3-4. Class 테이블 — 관계 추가

```prisma
model Class {
  // ... 기존 필드 모두 유지 ...

  makeupSlots MakeupSlot[]  // 신규: 역방향 관계
}
```

### 3-5. Student 테이블 — 관계 추가

```prisma
model Student {
  // ... 기존 필드 모두 유지 ...

  makeupRequests MakeupRequest[]  // 신규: 역방향 관계
}
```

### 3-6. User 테이블 — 관계 추가

```prisma
model User {
  // ... 기존 필드 모두 유지 ...

  notificationPreferences NotificationPreference[]  // 신규: 역방향 관계
}
```

---

## 4. 전체 관계도

```
User (1) ──→ (N) NotificationPreference

Teacher (1) ──→ (N) MakeupSlot
Class (1) ──→ (N) MakeupSlot (optional)

Student (1) ──→ (N) MakeupRequest
Attendance (1) ──→ (N) MakeupRequest
MakeupSlot (1) ──→ (N) MakeupRequest

NotificationTemplate (1) ──→ (N) Notification (optional FK)

[신규 흐름]
Attendance(ABSENT) → MakeupRequest(PENDING) → MakeupSlot → 승인 → 보강 실시 → COMPLETED
                                                         → 거절 → REJECTED
                                                         → 취소 → CANCELLED
```

---

## 5. 인덱스 전략

### 5-1. 신규 인덱스 요약

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| MakeupSlot | `idx_teacher(teacherId)` | 강사별 슬롯 목록 |
| MakeupSlot | `idx_class(classId)` | 수업별 슬롯 필터 |
| MakeupSlot | `idx_date(slotDate)` | 날짜 범위 조회 |
| MakeupSlot | `idx_status(status)` | 가용 슬롯 필터 |
| MakeupSlot | `idx_teacher_date_status(teacherId, slotDate, status)` | 강사의 특정 기간 가용 슬롯 복합 조회 (핵심 쿼리) |
| MakeupRequest | `idx_student(studentId)` | 학생별 신청 내역 |
| MakeupRequest | `idx_slot(slotId)` | 슬롯별 신청 목록 |
| MakeupRequest | `idx_status(status)` | 상태별 필터 (PENDING 조회 등) |
| MakeupRequest | `idx_attendance(originalAttendanceId)` | 결석 레코드 기반 조회 |
| MakeupRequest | `unique(studentId, originalAttendanceId)` | 동일 결석 중복 신청 방지 |
| NotificationTemplate | `idx_type_channel(type, channel)` | 유형+채널 복합 조회 |
| NotificationTemplate | `idx_active(isActive)` | 활성 템플릿만 조회 |
| NotificationPreference | `unique(userId, notificationType)` | 사용자별 알림 유형 고유성 |
| NotificationPreference | `idx_user(userId)` | 사용자별 설정 목록 |
| Notification (신규) | `idx_template(templateId)` | 템플릿별 발송 내역 |
| Notification (신규) | `idx_scheduled(scheduledAt)` | 예약 발송 대상 조회 |

### 5-2. 핵심 쿼리별 인덱스 매핑

| 쿼리 시나리오 | 사용 인덱스 |
|-------------|------------|
| 학생이 보강 가능 슬롯 조회 | `MakeupSlot.idx_teacher_date_status` + `idx_class` |
| 강사가 대기 중 신청 확인 | `MakeupRequest.idx_status` WHERE status=PENDING |
| 예약 발송 스케줄러가 대상 조회 | `Notification.idx_scheduled` WHERE scheduledAt <= now() |
| 학생의 보강 이력 확인 | `MakeupRequest.idx_student` |

---

## 6. API 명세

### 공통 사항

- Base URL: `http://localhost:4000/api`
- 인증: `Authorization: Bearer <accessToken>` (모든 엔드포인트)
- 응답 형식: `{ success: boolean, data?: any, message?: string }`
- 에러 형식: `{ success: false, message: string, errors?: { field: string, message: string }[] }`

---

### 6-1. 보강 슬롯 (Makeup Slots)

#### POST /api/makeup/slots

보강 가능 시간 등록

- **권한:** TEACHER, ADMIN
- **제약:** 강사 본인의 슬롯만 생성 가능 (ADMIN은 teacherId 지정 가능)

```typescript
// Request Body
{
  classId?: number,          // null이면 전체 수업 대상
  slotDate: string,          // "2026-04-10"
  startTime: string,         // "14:00"
  endTime: string,           // "16:00"
  maxStudents?: number,      // default: 3
  isRecurring?: boolean,     // default: false
  recurringDay?: string      // "수" — isRecurring=true 시 필수
}

// Response 201
{
  success: true,
  data: {
    id: number,
    teacherId: number,
    classId: number | null,
    slotDate: string,
    startTime: string,
    endTime: string,
    maxStudents: number,
    currentCount: 0,
    status: "AVAILABLE",
    isRecurring: boolean,
    recurringDay: string | null,
    createdAt: string
  }
}

// Response 400 — 유효성 검증 실패
{ success: false, message: "입력값을 확인해주세요.", errors: [...] }

// Response 400 — 시간 충돌
{ success: false, message: "해당 시간에 이미 등록된 일정이 있습니다." }

// Response 403
{ success: false, message: "권한이 없습니다." }
```

#### GET /api/makeup/slots

강사의 보강 슬롯 목록 조회

- **권한:** TEACHER, ADMIN
- **필터:** 본인 슬롯만 반환 (ADMIN은 전체 또는 teacherId 필터)

```typescript
// Query Parameters
?startDate=2026-04-01       // 시작일 (필수)
&endDate=2026-04-30         // 종료일 (필수)
&classId=5                  // 수업 필터 (선택)
&status=AVAILABLE           // 상태 필터 (선택)
&page=1                     // 페이지 (기본 1)
&limit=20                   // 페이지 크기 (기본 20, 최대 100)

// Response 200
{
  success: true,
  data: {
    slots: [{
      id: number,
      teacherId: number,
      teacherName: string,
      classId: number | null,
      className: string | null,
      slotDate: string,
      startTime: string,
      endTime: string,
      maxStudents: number,
      currentCount: number,
      status: "AVAILABLE" | "FULL" | "CLOSED",
      isRecurring: boolean,
      recurringDay: string | null,
      requests: [{
        id: number,
        studentName: string,
        status: string
      }]
    }],
    total: number,
    page: number,
    limit: number
  }
}
```

#### GET /api/makeup/slots/available

학생/학부모용 보강 가능 슬롯 조회

- **권한:** STUDENT, PARENT, TEACHER, ADMIN
- **필터:** 학생이 수강 중인 수업의 강사 슬롯만 반환

```typescript
// Query Parameters
?studentId=12               // 대상 학생 (PARENT의 경우 자녀, STUDENT는 본인)
&classId=5                  // 특정 수업 필터 (선택)
&startDate=2026-04-01       // 시작일 (선택, 기본: 오늘)
&endDate=2026-04-30         // 종료일 (선택, 기본: 오늘+30일)

// Response 200
{
  success: true,
  data: {
    slots: [{
      id: number,
      teacherName: string,
      className: string | null,
      slotDate: string,
      startTime: string,
      endTime: string,
      maxStudents: number,
      currentCount: number,
      remainingSpots: number    // maxStudents - currentCount
    }],
    total: number
  }
}

// Response 403 — 타인의 학생 조회 시도
{ success: false, message: "해당 학생의 정보를 조회할 권한이 없습니다." }
```

#### PATCH /api/makeup/slots/:id

보강 슬롯 수정/닫기

- **권한:** TEACHER (본인 슬롯), ADMIN
- **제약:** APPROVED된 신청이 있는 슬롯은 날짜/시간 변경 불가

```typescript
// Request Body (부분 업데이트)
{
  slotDate?: string,
  startTime?: string,
  endTime?: string,
  maxStudents?: number,
  status?: "AVAILABLE" | "CLOSED"   // FULL은 시스템 자동 전환만 허용
}

// Response 200
{
  success: true,
  data: { id, slotDate, startTime, endTime, maxStudents, status, ... }
}

// Response 400 — 승인된 신청 존재 시 시간 변경 시도
{ success: false, message: "승인된 보강 신청이 있어 시간을 변경할 수 없습니다." }

// Response 403
{ success: false, message: "본인의 보강 슬롯만 수정할 수 있습니다." }

// Response 404
{ success: false, message: "보강 슬롯을 찾을 수 없습니다." }
```

#### DELETE /api/makeup/slots/:id

보강 슬롯 삭제

- **권한:** TEACHER (본인 슬롯), ADMIN
- **제약:** APPROVED/COMPLETED 상태 신청이 있으면 삭제 불가 (PENDING은 자동 CANCELLED 처리)

```typescript
// Response 200
{ success: true, message: "보강 슬롯이 삭제되었습니다." }

// Response 400 — 승인된 신청 존재
{ success: false, message: "승인된 보강 신청이 있어 삭제할 수 없습니다. 먼저 슬롯을 닫아주세요." }

// Response 403
{ success: false, message: "본인의 보강 슬롯만 삭제할 수 있습니다." }

// Response 404
{ success: false, message: "보강 슬롯을 찾을 수 없습니다." }
```

---

### 6-2. 보강 신청 (Makeup Requests)

#### POST /api/makeup/requests

보강 신청 생성

- **권한:** STUDENT (본인), PARENT (자녀), TEACHER (학생 대신), ADMIN
- **제약:** 원본 출석이 ABSENT 또는 EXCUSED이어야 함. 동일 출석에 중복 신청 불가.

```typescript
// Request Body
{
  studentId: number,              // STUDENT 역할은 본인 ID만 허용
  originalAttendanceId: number,   // ABSENT/EXCUSED 상태 출석 ID
  slotId: number,                 // 보강 슬롯 ID
  studentNote?: string            // 학생 메모
}

// Response 201
{
  success: true,
  data: {
    id: number,
    studentId: number,
    studentName: string,
    originalAttendanceId: number,
    originalDate: string,
    className: string,
    slotId: number,
    slotDate: string,
    slotTime: string,
    status: "PENDING",
    studentNote: string | null,
    requestedAt: string
  }
}

// Response 400 — 출석 상태 부적합
{ success: false, message: "결석 또는 인정결석 기록만 보강 신청이 가능합니다." }

// Response 400 — 슬롯 만석
{ success: false, message: "해당 보강 슬롯이 가득 찼습니다." }

// Response 400 — 슬롯 마감
{ success: false, message: "해당 보강 슬롯은 마감되었습니다." }

// Response 409 — 중복 신청
{ success: false, message: "해당 결석에 대해 이미 보강 신청이 존재합니다." }

// Response 403
{ success: false, message: "해당 학생의 보강을 신청할 권한이 없습니다." }
```

#### GET /api/makeup/requests

보강 신청 목록 조회 (역할별 필터)

- **권한:** 전체 (역할에 따라 자동 필터)
  - STUDENT: 본인 신청만
  - PARENT: 자녀 신청만
  - TEACHER: 본인 슬롯에 들어온 신청만
  - ADMIN: 전체

```typescript
// Query Parameters
?status=PENDING             // 상태 필터 (선택)
&studentId=12               // 학생 필터 (TEACHER, ADMIN)
&classId=5                  // 수업 필터 (선택)
&startDate=2026-04-01       // 신청일 시작 (선택)
&endDate=2026-04-30         // 신청일 종료 (선택)
&page=1
&limit=20

// Response 200
{
  success: true,
  data: {
    requests: [{
      id: number,
      studentId: number,
      studentName: string,
      originalAttendance: {
        id: number,
        date: string,
        className: string,
        status: string
      },
      slot: {
        id: number,
        slotDate: string,
        startTime: string,
        endTime: string,
        teacherName: string
      },
      status: string,
      studentNote: string | null,
      teacherNote: string | null,
      requestedAt: string,
      approvedAt: string | null,
      completedAt: string | null
    }],
    total: number,
    page: number,
    limit: number
  }
}
```

#### GET /api/makeup/requests/pending

강사용 대기 중 보강 신청 조회

- **권한:** TEACHER, ADMIN
- **설명:** PENDING 상태인 신청만 반환. 강사 대시보드용.

```typescript
// Query Parameters
?classId=5                  // 수업 필터 (선택)
&page=1
&limit=20

// Response 200
{
  success: true,
  data: {
    requests: [{
      id: number,
      studentName: string,
      studentPhone: string,
      originalDate: string,
      originalClassName: string,
      absentReason: string | null,
      requestedSlot: {
        id: number,
        slotDate: string,
        startTime: string,
        endTime: string,
        currentCount: number,
        maxStudents: number
      },
      studentNote: string | null,
      requestedAt: string
    }],
    total: number,
    page: number,
    limit: number
  }
}
```

#### PATCH /api/makeup/requests/:id

보강 신청 상태 변경

- **권한:**
  - TEACHER/ADMIN: APPROVE, REJECT, COMPLETE
  - STUDENT/PARENT: CANCEL (본인/자녀 신청만)
- **부수효과:** APPROVED 시 MakeupSlot.currentCount 증가, CANCELLED/REJECTED 시 감소

```typescript
// Request Body
{
  action: "APPROVE" | "REJECT" | "COMPLETE" | "CANCEL",
  teacherNote?: string    // APPROVE, REJECT 시 강사 메모
}

// Response 200
{
  success: true,
  data: {
    id: number,
    status: string,
    teacherNote: string | null,
    approvedAt: string | null,
    completedAt: string | null
  }
}

// Response 400 — 상태 전이 불가
{ success: false, message: "현재 상태에서는 해당 작업을 수행할 수 없습니다." }

// Response 403
{ success: false, message: "권한이 없습니다." }

// Response 404
{ success: false, message: "보강 신청을 찾을 수 없습니다." }
```

**상태 전이 규칙:**

```
PENDING  → APPROVED   (TEACHER, ADMIN)
PENDING  → REJECTED   (TEACHER, ADMIN)
PENDING  → CANCELLED  (STUDENT, PARENT — 본인/자녀만)
APPROVED → COMPLETED  (TEACHER, ADMIN)
APPROVED → CANCELLED  (TEACHER, ADMIN, STUDENT, PARENT)
```

그 외 전이는 모두 400 에러.

---

### 6-3. 알림 설정 (Notification Settings)

#### GET /api/notifications/preferences

사용자 알림 수신 설정 조회

- **권한:** 전체 (본인 설정만)

```typescript
// Response 200
{
  success: true,
  data: {
    preferences: [{
      notificationType: string,     // "SESSION_SUMMARY"
      displayName: string,          // "수업 요약 알림"
      channelSms: boolean,
      channelKakao: boolean,
      channelPush: boolean
    }]
  }
}
```

**참고:** 아직 NotificationPreference 레코드가 없는 유형은 기본값(전부 true)으로 반환한다.

#### PATCH /api/notifications/preferences

알림 수신 설정 변경

- **권한:** 전체 (본인 설정만)

```typescript
// Request Body
{
  preferences: [{
    notificationType: string,
    channelSms?: boolean,
    channelKakao?: boolean,
    channelPush?: boolean
  }]
}

// Response 200
{
  success: true,
  data: {
    updated: number,       // 변경된 설정 수
    preferences: [...]     // 전체 설정 반환
  }
}

// Response 400 — 유효하지 않은 notificationType
{ success: false, message: "유효하지 않은 알림 유형입니다: INVALID_TYPE" }
```

#### GET /api/notifications/templates

알림 템플릿 목록 조회

- **권한:** ADMIN

```typescript
// Query Parameters
?type=MAKEUP_CONFIRMED      // 유형 필터 (선택)
&channel=KAKAO              // 채널 필터 (선택)
&isActive=true              // 활성 상태 필터 (선택)

// Response 200
{
  success: true,
  data: {
    templates: [{
      id: number,
      type: string,
      channel: string,
      name: string,
      templateCode: string | null,
      content: string,
      variables: string[] | null,
      isActive: boolean,
      createdAt: string
    }],
    total: number
  }
}
```

#### POST /api/notifications/templates

알림 템플릿 생성

- **권한:** ADMIN

```typescript
// Request Body
{
  type: string,              // NotificationTemplateType enum 값
  channel: string,           // NotificationChannel enum 값
  name: string,              // "보강 승인 알림 (카카오)"
  templateCode?: string,     // 카카오 알림톡 코드
  content: string,           // "{{studentName}}님의 보강이 {{date}}에 확정되었습니다."
  variables?: string[]       // ["studentName", "date"]
}

// Response 201
{
  success: true,
  data: { id, type, channel, name, content, variables, isActive, createdAt }
}

// Response 400
{ success: false, message: "입력값을 확인해주세요.", errors: [...] }
```

#### PATCH /api/notifications/templates/:id

알림 템플릿 수정

- **권한:** ADMIN

```typescript
// Request Body (부분 업데이트)
{
  name?: string,
  templateCode?: string,
  content?: string,
  variables?: string[],
  isActive?: boolean
}

// Response 200
{
  success: true,
  data: { id, type, channel, name, content, variables, isActive, updatedAt }
}
```

---

## 7. 보안 설계

### 7-1. RBAC 매트릭스

| 엔드포인트 | ADMIN | TEACHER | PARENT | STUDENT |
|-----------|-------|---------|--------|---------|
| POST /makeup/slots | O (전체) | O (본인) | X | X |
| GET /makeup/slots | O (전체) | O (본인) | X | X |
| GET /makeup/slots/available | O | O | O (자녀) | O (본인) |
| PATCH /makeup/slots/:id | O | O (본인) | X | X |
| DELETE /makeup/slots/:id | O | O (본인) | X | X |
| POST /makeup/requests | O | O | O (자녀) | O (본인) |
| GET /makeup/requests | O (전체) | O (본인 슬롯) | O (자녀) | O (본인) |
| GET /makeup/requests/pending | O | O (본인 슬롯) | X | X |
| PATCH /makeup/requests/:id (APPROVE/REJECT/COMPLETE) | O | O (본인 슬롯) | X | X |
| PATCH /makeup/requests/:id (CANCEL) | O | O | O (자녀) | O (본인) |
| GET /notifications/preferences | O | O | O | O |
| PATCH /notifications/preferences | O | O | O | O |
| GET /notifications/templates | O | X | X | X |
| POST /notifications/templates | O | X | X | X |
| PATCH /notifications/templates/:id | O | X | X | X |

### 7-2. 데이터 격리 (Row-Level Security)

```
TEACHER:
  - MakeupSlot: WHERE teacherId = currentUser.teacherProfile.id
  - MakeupRequest: WHERE slot.teacherId = currentUser.teacherProfile.id

STUDENT:
  - MakeupRequest: WHERE studentId = currentUser.studentProfile.id
  - MakeupSlot/available: 본인이 수강 중인 수업의 강사 슬롯만

PARENT:
  - MakeupRequest: WHERE student.parentId = currentUser.parentProfile.id
  - MakeupSlot/available: 자녀가 수강 중인 수업의 강사 슬롯만

ADMIN:
  - 필터 없음 (전체 접근)
```

### 7-3. 입력 검증 규칙

| 필드 | 규칙 |
|------|------|
| slotDate | isISO8601(), 과거 날짜 불가 (생성 시) |
| startTime | matches(/^([01]\d\|2[0-3]):[0-5]\d$/), "HH:mm" 형식 |
| endTime | matches(/^([01]\d\|2[0-3]):[0-5]\d$/), startTime보다 이후 |
| maxStudents | isInt({ min: 1, max: 20 }) |
| recurringDay | isIn(["월","화","수","목","금","토","일"]) |
| studentNote | isLength({ max: 500 }), trim() |
| teacherNote | isLength({ max: 500 }), trim() |
| notificationType | isIn([...NotificationTemplateType 값들]) |
| template.content | isLength({ min: 1, max: 2000 }), trim() |
| template.name | isLength({ min: 1, max: 100 }), trim() |
| action (PATCH request) | isIn(["APPROVE","REJECT","COMPLETE","CANCEL"]) |

### 7-4. Rate Limiting

| 엔드포인트 | 제한 | 사유 |
|-----------|------|------|
| POST /makeup/requests | 10회/분 | 보강 신청 남용 방지 |
| PATCH /makeup/requests/:id | 20회/분 | 일괄 승인 허용 |
| POST /notifications/templates | 5회/분 | 템플릿 남용 방지 |
| PATCH /notifications/preferences | 10회/분 | 일반적 설정 변경 |
| GET /makeup/slots/available | 30회/분 | 조회 빈도 허용 |
| 기타 보강 API | 60회/분 | 일반 제한 |

### 7-5. 비즈니스 규칙 검증 (서비스 레이어)

1. **슬롯 시간 충돌 검사:** 동일 강사, 동일 날짜에 겹치는 시간대의 슬롯 생성 방지
2. **보강 신청 자격 검사:**
   - 원본 출석이 ABSENT/EXCUSED인지 확인
   - 해당 학생이 원본 수업에 수강 등록되어 있는지 확인
   - 슬롯 강사가 원본 수업 강사인지 확인 (또는 classId=null인 슬롯)
3. **currentCount 정합성:** MakeupRequest 상태 변경 시 트랜잭션으로 MakeupSlot.currentCount 동기화
4. **FULL 자동 전환:** currentCount >= maxStudents 시 status를 FULL로 자동 전환

---

## 8. 마이그레이션 계획

### 8-1. 마이그레이션 순서

```
1. 새 enum 타입 생성 (MakeupSlotStatus, MakeupRequestStatus, NotificationChannel, NotificationTemplateType)
2. NotificationTemplate 테이블 생성
3. Notification 테이블에 channel, templateId, scheduledAt 컬럼 추가 (nullable)
4. MakeupSlot 테이블 생성
5. MakeupRequest 테이블 생성
6. NotificationPreference 테이블 생성
7. 인덱스 생성
```

### 8-2. 롤백 전략

각 단계는 역순으로 롤백 가능하다. Notification 테이블 확장 필드는 nullable이므로 컬럼 삭제만으로 롤백된다.

---

## 9. 시드 데이터 (개발용)

```typescript
const makeupSeedData = {
  makeupSlots: [
    {
      teacherId: 1,           // 기존 강사
      classId: null,          // 전체 수업 대상
      slotDate: "2026-04-10",
      startTime: "14:00",
      endTime: "16:00",
      maxStudents: 3,
      status: "AVAILABLE"
    },
    {
      teacherId: 1,
      classId: 1,             // 수학 수업 한정
      slotDate: "2026-04-12",
      startTime: "10:00",
      endTime: "12:00",
      maxStudents: 2,
      status: "AVAILABLE"
    }
  ],
  notificationTemplates: [
    {
      type: "SESSION_SUMMARY",
      channel: "SMS",
      name: "수업 요약 SMS",
      content: "[{{className}}] {{date}} 수업 요약: {{topic}}. 숙제: {{homework}}",
      variables: ["className", "date", "topic", "homework"]
    },
    {
      type: "ABSENT_NOTICE",
      channel: "SMS",
      name: "결석 알림 SMS",
      content: "[{{className}}] {{studentName}} 학생이 {{date}} 수업에 결석하였습니다. 보강 신청: {{makeupUrl}}",
      variables: ["className", "studentName", "date", "makeupUrl"]
    },
    {
      type: "MAKEUP_CONFIRMED",
      channel: "SMS",
      name: "보강 승인 SMS",
      content: "{{studentName}}님의 보강이 확정되었습니다. 일시: {{date}} {{time}}",
      variables: ["studentName", "date", "time"]
    },
    {
      type: "MAKEUP_REJECTED",
      channel: "SMS",
      name: "보강 거절 SMS",
      content: "{{studentName}}님의 보강 신청이 반려되었습니다. 사유: {{reason}}",
      variables: ["studentName", "reason"]
    },
    {
      type: "MAKEUP_REMINDER",
      channel: "SMS",
      name: "보강 리마인더 SMS",
      content: "내일 {{time}} 보강 수업이 예정되어 있습니다. ({{className}})",
      variables: ["time", "className"]
    }
  ]
};
```

---

## 10. 다음 단계 진입 조건

- [ ] 본 설계서 Director 승인
- [ ] Prisma schema 파일에 모델 추가 (④ 코딩 BE 단계)
- [ ] `prisma migrate dev` 실행하여 마이그레이션 생성
- [ ] 시드 데이터 업데이트
- [ ] API 라우트 구현 (④ 코딩 BE 단계)
