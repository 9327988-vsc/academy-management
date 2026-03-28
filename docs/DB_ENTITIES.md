# DB 엔티티 관계도 (DB_ENTITIES)

**프로젝트:** Academy Smart Management System (ASMS)
**작성일:** 2026-03-28
**DB명:** academy
**RDBMS:** MySQL 8.0.45 / ORM: Prisma 5.x

---

## ERD 개요

```
User (선생님)
  │
  ├── 1:N ──→ Class (수업)
  │              │
  │              ├── M:N ──→ Student (학생) [through ClassStudent]
  │              │              │
  │              │              ├── 1:N ──→ Parent (학부모)
  │              │              └── 1:N ──→ Attendance (출석)
  │              │
  │              └── 1:N ──→ ClassSession (수업 세션)
  │                             │
  │                             ├── 1:N ──→ Attendance (출석)
  │                             └── 1:N ──→ Notification (알림)
  │
  └── 1:N ──→ Student (학생) [소속 관계]
```

---

## 엔티티 상세 (MVP 8개 테이블)

### 1. User (사용자/선생님)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | VARCHAR(36) | PK, UUID | 고유 식별자 |
| email | VARCHAR(100) | UNIQUE, NOT NULL | 로그인 이메일 |
| password | VARCHAR(255) | NOT NULL | bcrypt 해시 |
| name | VARCHAR(50) | NOT NULL | 이름 |
| phone | VARCHAR(20) | NOT NULL | 전화번호 |
| role | ENUM('teacher') | DEFAULT 'teacher' | MVP: teacher만 |
| created_at | TIMESTAMP | DEFAULT NOW | 생성일 |
| updated_at | TIMESTAMP | ON UPDATE | 수정일 |

**인덱스:** `idx_email(email)`
**관계:** 1:N → Class, 1:N → Student

---

### 2. Class (수업)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | VARCHAR(36) | PK, UUID | 고유 식별자 |
| teacher_id | VARCHAR(36) | FK → users.id | 담당 선생님 |
| name | VARCHAR(100) | NOT NULL | 수업명 ("수학 중3 심화반") |
| subject | VARCHAR(50) | NOT NULL | 과목 ("수학") |
| day_of_week | VARCHAR(20) | NOT NULL | 수업 요일 ("월,수,금") |
| start_time | TIME | NOT NULL | 시작 시간 |
| end_time | TIME | NOT NULL | 종료 시간 |
| room | VARCHAR(50) | NULL | 교실 |
| max_students | INT | DEFAULT 15 | 정원 |
| created_at | TIMESTAMP | DEFAULT NOW | 생성일 |
| updated_at | TIMESTAMP | ON UPDATE | 수정일 |

**인덱스:** `idx_teacher(teacher_id)`
**관계:** N:1 → User, 1:N → ClassStudent, 1:N → ClassSession

---

### 3. Student (학생)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | VARCHAR(36) | PK, UUID | 고유 식별자 |
| name | VARCHAR(50) | NOT NULL | 이름 |
| phone | VARCHAR(20) | NULL | 전화번호 |
| grade | VARCHAR(20) | NULL | 학년 ("중3") |
| school | VARCHAR(100) | NULL | 학교명 |
| teacher_id | VARCHAR(36) | FK → users.id | 등록한 선생님 |
| created_at | TIMESTAMP | DEFAULT NOW | 생성일 |
| updated_at | TIMESTAMP | ON UPDATE | 수정일 |

**인덱스:** `idx_teacher(teacher_id)`
**관계:** N:1 → User, 1:N → Parent, M:N → Class (through ClassStudent), 1:N → Attendance

---

### 4. Parent (학부모)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | VARCHAR(36) | PK, UUID | 고유 식별자 |
| student_id | VARCHAR(36) | FK → students.id | 연결 학생 |
| name | VARCHAR(50) | NOT NULL | 이름 |
| phone | VARCHAR(20) | NOT NULL | 전화번호 (알림 수신) |
| relationship | VARCHAR(20) | NULL | 관계 ("부"/"모"/"조부모") |
| created_at | TIMESTAMP | DEFAULT NOW | 생성일 |

**인덱스:** `idx_student(student_id)`
**관계:** N:1 → Student

---

### 5. ClassStudent (수강 연결 — 조인 테이블)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | VARCHAR(36) | PK, UUID | 고유 식별자 |
| class_id | VARCHAR(36) | FK → classes.id | 수업 |
| student_id | VARCHAR(36) | FK → students.id | 학생 |
| enrolled_at | TIMESTAMP | DEFAULT NOW | 등록일 |

**인덱스:** `idx_class(class_id)`, `idx_student(student_id)`
**제약:** `UNIQUE(class_id, student_id)` — 중복 수강 방지

---

### 6. ClassSession (수업 세션)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | VARCHAR(36) | PK, UUID | 고유 식별자 |
| class_id | VARCHAR(36) | FK → classes.id | 수업 |
| session_date | DATE | NOT NULL | 수업 일자 |
| start_time | TIME | NOT NULL | 시작 시간 |
| end_time | TIME | NOT NULL | 종료 시간 |
| topic | VARCHAR(200) | NULL | 오늘 진도 |
| textbook | VARCHAR(100) | NULL | 교재명 |
| pages | VARCHAR(50) | NULL | 페이지 범위 |
| key_concepts | TEXT | NULL | 핵심 개념 |
| homework | TEXT | NULL | 숙제 내용 |
| homework_due_date | DATE | NULL | 숙제 마감일 |
| next_topic | VARCHAR(200) | NULL | 다음 수업 예고 |
| special_notes | TEXT | NULL | 특이사항 |
| notification_sent | BOOLEAN | DEFAULT FALSE | 알림 발송 여부 |
| created_at | TIMESTAMP | DEFAULT NOW | 생성일 |

**인덱스:** `idx_class_date(class_id, session_date)`, `idx_notification_sent(notification_sent)`
**관계:** N:1 → Class, 1:N → Attendance, 1:N → Notification

---

### 7. Attendance (출석 기록)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | VARCHAR(36) | PK, UUID | 고유 식별자 |
| session_id | VARCHAR(36) | FK → class_sessions.id | 수업 세션 |
| student_id | VARCHAR(36) | FK → students.id | 학생 |
| status | ENUM('present','absent','late') | NOT NULL | 출결 상태 |
| check_time | TIMESTAMP | DEFAULT NOW | 체크 시각 |
| notes | TEXT | NULL | 비고 |

**인덱스:** `idx_session(session_id)`, `idx_student(student_id)`, `idx_status(status)`
**제약:** `UNIQUE(session_id, student_id)` — 세션당 1회 체크

---

### 8. Notification (알림 발송 로그)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | VARCHAR(36) | PK, UUID | 고유 식별자 |
| session_id | VARCHAR(36) | FK → class_sessions.id | 수업 세션 |
| recipient_phone | VARCHAR(20) | NOT NULL | 수신 전화번호 |
| recipient_name | VARCHAR(50) | NOT NULL | 수신자 이름 |
| recipient_type | ENUM('student','parent') | NOT NULL | 수신자 유형 |
| content | TEXT | NOT NULL | 메시지 내용 |
| status | ENUM('pending','sent','failed') | DEFAULT 'pending' | 발송 상태 |
| sent_at | TIMESTAMP | NULL | 발송 시각 |
| error_message | TEXT | NULL | 에러 메시지 |
| created_at | TIMESTAMP | DEFAULT NOW | 생성일 |

**인덱스:** `idx_session(session_id)`, `idx_status(status)`, `idx_sent_at(sent_at)`

---

## 엔티티 관계 요약

```
User ──1:N──→ Class ──1:N──→ ClassSession ──1:N──→ Attendance
  │              │                │                     ↑
  │              │                └──1:N──→ Notification │
  │              │                                      │
  │              └──M:N──→ Student ─────────────────────┘
  │                (ClassStudent)    │
  └──1:N──→ Student                 └──1:N──→ Parent
```

---

## 확장 대비 설계 포인트

1. **User.role**: MVP에서는 `teacher`만 사용하나, ENUM 확장으로 `admin`, `student`, `parent` 추가 가능
2. **Academy 테이블**: Phase 2에서 멀티 학원 지원 시 추가
3. **Payment 테이블**: Phase 3 결제 관리 시 `enrollments` 기반 추가
4. **AIQuestion 테이블**: Phase 3 AI 풀이 시 학습 이력 저장용 추가
5. **모든 PK는 UUID**: 분산 환경/마이그레이션 용이
6. **utf8mb4_unicode_ci**: 한글 + 이모지 완전 지원
