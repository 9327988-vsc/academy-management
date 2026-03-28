# API_SPEC.md — API 상세 명세서

**프로젝트:** Academy Smart Management System (ASMS)
**작성일:** 2026-03-28
**단계:** Phase 3 디자인 (BE)
**Base URL:** `http://localhost:4000/api`

---

## 공통 사항

### 인증 헤더
```
Authorization: Bearer <accessToken>
```
`/auth/*` 를 제외한 모든 API에 필요.

### 응답 형식
```typescript
// 성공
{ success: true, data?: any, message?: string }

// 실패
{ success: false, message: string, errors?: { field: string, message: string }[] }
```

---

## 1. 인증 (Authentication)

### POST /auth/register
회원가입

```typescript
// Request
{ email: string, password: string, name: string, phone: string }

// Response 201
{ success: true, message: "회원가입이 완료되었습니다." }

// Response 400 — 유효성 검증 실패
{ success: false, message: "입력값을 확인해주세요.", errors: [...] }

// Response 409 — 이메일 중복
{ success: false, message: "이미 가입된 이메일입니다." }
```

### POST /auth/login
로그인

```typescript
// Request
{ email: string, password: string }

// Response 200
{
  success: true,
  accessToken: string,
  refreshToken: string,
  user: { id: string, name: string, email: string, role: string }
}

// Response 401
{ success: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." }
```

### POST /auth/refresh
토큰 갱신

```typescript
// Request
{ refreshToken: string }

// Response 200
{ success: true, accessToken: string }

// Response 401
{ success: false, message: "유효하지 않은 리프레시 토큰입니다." }
```

### POST /auth/logout
로그아웃

```typescript
// Response 200
{ success: true, message: "로그아웃되었습니다." }
```

---

## 2. 사용자 (User)

### GET /users/me
내 정보 조회

```typescript
// Response 200
{
  success: true,
  data: { id: string, name: string, email: string, phone: string, role: string }
}
```

### PATCH /users/me
내 정보 수정

```typescript
// Request
{ name?: string, phone?: string }

// Response 200
{ success: true, data: { id, name, email, phone, role } }
```

---

## 3. 수업 (Class)

### GET /classes
수업 목록 조회

```typescript
// Query: ?date=2026-03-26 (선택 — 해당 요일 수업만 필터)

// Response 200
{
  success: true,
  data: {
    classes: [{
      id: string,
      name: string,
      subject: string,
      dayOfWeek: string,
      startTime: string,
      endTime: string,
      room: string | null,
      maxStudents: number,
      studentCount: number,  // 수강 학생 수 (집계)
      createdAt: string
    }]
  }
}
```

### GET /classes/:id
수업 상세 조회

```typescript
// Response 200
{
  success: true,
  data: {
    id, name, subject, dayOfWeek, startTime, endTime, room, maxStudents,
    teacher: { id, name, phone },
    students: [{
      id, name, phone, grade, school,
      parents: [{ id, name, phone, relationship }]
    }]
  }
}

// Response 404
{ success: false, message: "수업을 찾을 수 없습니다." }
```

### POST /classes
수업 생성

```typescript
// Request
{
  name: string,
  subject: string,
  dayOfWeek: string,    // "월,수,금"
  startTime: string,    // "17:00"
  endTime: string,      // "19:00"
  room?: string,
  maxStudents?: number  // default: 15
}

// Response 201
{ success: true, data: { id, name, subject, ... } }
```

### PATCH /classes/:id
수업 수정

```typescript
// Request (부분 업데이트)
{ name?, subject?, dayOfWeek?, startTime?, endTime?, room?, maxStudents? }

// Response 200
{ success: true, data: { ... } }

// Response 403 — 본인 수업이 아닌 경우
{ success: false, message: "수정 권한이 없습니다." }
```

### DELETE /classes/:id
수업 삭제 (CASCADE: 수강, 세션, 출석, 알림 모두 삭제)

```typescript
// Response 200
{ success: true, message: "수업이 삭제되었습니다." }
```

---

## 4. 학생 (Student)

### POST /students
학생 생성 (학부모 포함)

```typescript
// Request
{
  name: string,
  phone?: string,
  grade?: string,
  school?: string,
  parents: [{
    name: string,
    phone: string,
    relationship: string  // "부" | "모" | "조부모" 등
  }]
}

// Response 201
{ success: true, data: { id, name, phone, grade, school, parents: [...] } }
```

### PATCH /students/:id
학생 수정

```typescript
// Request
{ name?, phone?, grade?, school? }

// Response 200
{ success: true, data: { ... } }
```

### DELETE /students/:id
학생 삭제 (CASCADE: 학부모, 출석 삭제)

```typescript
// Response 200
{ success: true, message: "학생이 삭제되었습니다." }
```

### POST /students/:id/parents
학부모 추가

```typescript
// Request
{ name: string, phone: string, relationship: string }

// Response 201
{ success: true, data: { id, name, phone, relationship } }
```

### DELETE /parents/:id
학부모 삭제

```typescript
// Response 200
{ success: true, message: "학부모 정보가 삭제되었습니다." }
```

---

## 5. 수업-학생 연결 (Enrollment)

### GET /classes/:id/students
수업별 학생 목록

```typescript
// Response 200
{
  success: true,
  data: {
    students: [{
      id, name, phone, grade, school,
      enrolledAt: string,
      parents: [{ id, name, phone, relationship }]
    }]
  }
}
```

### POST /classes/:id/enroll
수업에 학생 등록

```typescript
// Request
{ studentId: string }

// Response 201
{ success: true, message: "학생이 수업에 등록되었습니다." }

// Response 400 — 정원 초과
{ success: false, message: "수업 정원이 가득 찼습니다." }

// Response 409 — 중복 등록
{ success: false, message: "이미 등록된 학생입니다." }
```

### DELETE /classes/:classId/students/:studentId
수업에서 학생 제거

```typescript
// Response 200
{ success: true, message: "학생이 수업에서 제거되었습니다." }
```

---

## 6. 수업 세션 (ClassSession)

### POST /sessions
수업 세션 생성 (수업 종료 처리)

```typescript
// Request
{
  classId: string,
  sessionDate: string,      // "2026-03-26"
  startTime: string,
  endTime: string,
  topic?: string,
  textbook?: string,
  pages?: string,
  keyConcepts?: string,
  homework?: string,
  homeworkDueDate?: string,
  nextTopic?: string,
  specialNotes?: string
}

// Response 201
{ success: true, data: { id, classId, sessionDate, ... } }
```

### GET /sessions/:id
세션 상세 조회

```typescript
// Response 200
{
  success: true,
  data: {
    id, classId, sessionDate, startTime, endTime,
    topic, textbook, pages, keyConcepts, homework,
    homeworkDueDate, nextTopic, specialNotes, notificationSent,
    class: { id, name, subject },
    attendance: [{ studentId, studentName, status }]
  }
}
```

### GET /classes/:id/sessions
수업별 세션 목록

```typescript
// Query: ?limit=10&offset=0

// Response 200
{
  success: true,
  data: {
    sessions: [{ id, sessionDate, topic, notificationSent }],
    total: number
  }
}
```

---

## 7. 출석 (Attendance)

### POST /attendance/bulk
출석 일괄 등록

```typescript
// Request
{
  sessionId: string,
  attendance: [{
    studentId: string,
    status: "present" | "absent" | "late",
    notes?: string
  }]
}

// Response 201
{ success: true, data: { count: number } }
```

### PATCH /attendance/:id
개별 출석 수정

```typescript
// Request
{ status: "present" | "absent" | "late", notes?: string }

// Response 200
{ success: true, data: { id, sessionId, studentId, status, checkTime, notes } }
```

### GET /sessions/:id/attendance
세션별 출석 현황

```typescript
// Response 200
{
  success: true,
  data: {
    sessionId: string,
    sessionDate: string,
    attendance: [{
      id, studentId, studentName, status, checkTime, notes
    }],
    stats: {
      present: number,
      absent: number,
      late: number,
      total: number
    }
  }
}
```

---

## 8. 알림 (Notification)

### POST /sessions/:id/preview-notification
알림 미리보기

```typescript
// Response 200
{
  success: true,
  data: {
    presentStudents: [{
      studentId: string,
      studentName: string,
      message: string,
      recipients: [{ type: "student" | "parent", name: string, phone: string }]
    }],
    absentStudents: [{ ... }],
    totalRecipients: number
  }
}
```

### POST /sessions/:id/send-notification
알림 발송 (MVP: 콘솔 로그, Phase 2: 실제 SMS)

```typescript
// Response 200
{
  success: true,
  data: {
    total: number,
    sent: number,
    failed: number,
    details: [{
      recipientName: string,
      recipientPhone: string,
      recipientType: "student" | "parent",
      status: "sent" | "failed",
      sentAt?: string,
      errorMessage?: string
    }]
  }
}

// Response 400 — 출석 기록 없음
{ success: false, message: "출석 체크를 먼저 완료해주세요." }
```

### GET /notifications
알림 발송 내역

```typescript
// Query: ?sessionId=...&status=...&limit=20&offset=0

// Response 200
{
  success: true,
  data: {
    notifications: [{
      id, sessionId, recipientPhone, recipientName,
      recipientType, content, status, sentAt, errorMessage
    }],
    total: number
  }
}
```

---

## 9. 대시보드 (Dashboard)

### GET /dashboard/stats
대시보드 통계

```typescript
// Response 200
{
  success: true,
  data: {
    todayClasses: number,
    totalStudents: number,
    totalClasses: number,
    recentSessions: [{
      id, classId, className, sessionDate, notificationSent
    }]
  }
}
```
