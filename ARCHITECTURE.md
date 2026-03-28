# ARCHITECTURE.md — 시스템 설계서

**프로젝트:** Academy Smart Management System (ASMS)
**작성일:** 2026-03-28
**단계:** Phase 2 설계 확정
**담당:** Engineering Manager Agent

---

## 1. 기술 스택 (확정)

```
Frontend:     React 18 + Vite 5 + TypeScript + Tailwind 3.4 + shadcn/ui
Backend:      Node.js 20 LTS + Express 4.19 + TypeScript
Database:     MySQL 8.0.45 + Prisma 5.x ORM
인증:         JWT (Access + Refresh Token) + bcrypt
상태 관리:    Zustand (전역) + TanStack Query (서버 상태)
폼:           React Hook Form
HTTP:         Axios
배포 환경:    로컬 개발 (Phase 1), 추후 VPS/클라우드
```

---

## 2. 아키텍처 개요

### 전체 흐름도

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  React 18 + Vite + TypeScript                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Pages    │ │Components│ │ Stores   │ │ API Layer│      │
│  │ (Router) │→│(shadcn)  │ │(Zustand) │ │ (Axios)  │      │
│  └──────────┘ └──────────┘ └──────────┘ └────┬─────┘      │
└──────────────────────────────────────────────┼──────────────┘
                                               │ HTTP/JSON
                                               ▼
┌──────────────────────────────────────────────────────────────┐
│                     API Server (Express)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Routes   │→│Controllers│→│ Services │→│ Prisma   │       │
│  └──────────┘ └──────────┘ └──────────┘ └────┬─────┘       │
│  ┌──────────┐                                 │              │
│  │Middleware │ (auth, validation, error)       │              │
│  └──────────┘                                 │              │
└───────────────────────────────────────────────┼──────────────┘
                                                │ TCP/3306
                                                ▼
                                   ┌──────────────────┐
                                   │   MySQL 8.0.45   │
                                   │   DB: academy     │
                                   │   8 tables        │
                                   └──────────────────┘
```

### 포트 할당

| 서비스 | 포트 |
|--------|------|
| Frontend (Vite Dev) | 5173 |
| Backend (Express) | 4000 |
| MySQL | 3306 |

---

## 3. 주요 모듈 목록

### Backend 모듈

```
backend/src/
├── app.ts                    # Express 앱 초기화, 미들웨어 등록
├── server.ts                 # 서버 시작 엔트리
│
├── routes/                   # 라우트 정의
│   ├── auth.routes.ts        # POST /auth/register, /auth/login, /auth/refresh, /auth/logout
│   ├── user.routes.ts        # GET/PATCH /users/me
│   ├── class.routes.ts       # CRUD /classes, /classes/:id/students, /classes/:id/enroll
│   ├── student.routes.ts     # CRUD /students, /students/:id/parents
│   ├── session.routes.ts     # CRUD /sessions, /classes/:id/sessions
│   ├── attendance.routes.ts  # POST /attendance/bulk, PATCH /attendance/:id
│   ├── notification.routes.ts # POST /sessions/:id/preview, /send, GET /notifications
│   └── dashboard.routes.ts   # GET /dashboard/stats
│
├── controllers/              # 요청/응답 핸들링
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── class.controller.ts
│   ├── student.controller.ts
│   ├── session.controller.ts
│   ├── attendance.controller.ts
│   ├── notification.controller.ts
│   └── dashboard.controller.ts
│
├── services/                 # 비즈니스 로직
│   ├── auth.service.ts       # 회원가입, 로그인, 토큰 발급/검증
│   ├── class.service.ts      # 수업 CRUD, 학생 등록/해제
│   ├── student.service.ts    # 학생 CRUD, 학부모 관리
│   ├── session.service.ts    # 수업 세션 생성/조회
│   ├── attendance.service.ts # 출석 일괄 등록/수정
│   ├── notification.service.ts # 알림 생성, 미리보기, 발송
│   └── dashboard.service.ts  # 통계 집계
│
├── middleware/
│   ├── auth.middleware.ts    # JWT 토큰 검증
│   ├── validate.middleware.ts # express-validator 기반 입력 검증
│   └── error.middleware.ts   # 전역 에러 핸들러
│
├── utils/
│   ├── jwt.ts               # 토큰 생성/검증 헬퍼
│   ├── password.ts           # bcrypt 해싱/비교
│   └── sms.ts               # SMS 발송 (Phase 2, 초기엔 콘솔 로그)
│
├── types/
│   └── index.ts             # 공용 타입 정의
│
└── prisma/
    ├── schema.prisma         # DB 스키마
    └── seed.ts              # 초기 데이터 시드
```

### Frontend 모듈

```
frontend/src/
├── App.tsx                   # 루트 컴포넌트, 라우터 설정
├── main.tsx                  # 엔트리 포인트
│
├── pages/                    # 페이지 컴포넌트
│   ├── LoginPage.tsx         # /login
│   ├── SignupPage.tsx        # /signup
│   ├── DashboardPage.tsx     # /dashboard
│   ├── ClassListPage.tsx     # /classes
│   ├── ClassDetailPage.tsx   # /classes/:id
│   ├── StudentManagePage.tsx # /classes/:id/students
│   ├── AttendancePage.tsx    # /classes/:id/attendance
│   └── NotificationPage.tsx  # /classes/:id/sessions/:sid/notify
│
├── components/
│   ├── ui/                   # shadcn/ui 컴포넌트
│   ├── layout/
│   │   ├── Header.tsx        # 상단 네비게이션
│   │   ├── Sidebar.tsx       # (선택) 사이드바
│   │   └── Layout.tsx        # 공용 레이아웃
│   ├── auth/
│   │   └── ProtectedRoute.tsx # 인증 라우트 가드
│   ├── class/
│   │   ├── ClassCard.tsx     # 수업 카드
│   │   └── ClassForm.tsx     # 수업 생성/수정 모달
│   ├── student/
│   │   ├── StudentCard.tsx   # 학생 카드
│   │   └── StudentForm.tsx   # 학생 추가 모달
│   ├── attendance/
│   │   └── AttendanceRow.tsx # 출석 체크 행
│   └── notification/
│       └── NotificationPreview.tsx # 알림 미리보기
│
├── api/                      # API 호출 함수
│   ├── client.ts             # Axios 인스턴스 (인터셉터, baseURL)
│   ├── auth.api.ts
│   ├── class.api.ts
│   ├── student.api.ts
│   ├── session.api.ts
│   ├── attendance.api.ts
│   ├── notification.api.ts
│   └── dashboard.api.ts
│
├── stores/                   # Zustand 스토어
│   └── authStore.ts          # 인증 상태 (user, token)
│
├── hooks/                    # 커스텀 훅
│   ├── useAuth.ts            # 인증 관련 훅
│   └── useClasses.ts         # TanStack Query 기반 데이터 훅
│
├── lib/
│   └── utils.ts              # 유틸리티 (cn, formatDate 등)
│
└── types/
    └── index.ts              # FE 타입 정의
```

### 모듈 간 의존 관계

```
[Pages] → [Components] → [API Layer] → [Backend Routes]
   ↕            ↕                            ↓
[Stores]    [Hooks]                    [Controllers]
                                            ↓
                                       [Services]
                                            ↓
                                       [Prisma ORM]
                                            ↓
                                        [MySQL]
```

---

## 4. 데이터 모델 (확정)

Phase 1에서 정의한 8개 테이블 그대로 사용. 상세는 `docs/DB_ENTITIES.md` 참조.

```
User ──1:N──→ Class ──1:N──→ ClassSession ──1:N──→ Attendance
  │              │                │                     ↑
  │              │                └──1:N──→ Notification │
  │              │                                      │
  │              └──M:N──→ Student ─────────────────────┘
  │                (ClassStudent)    │
  └──1:N──→ Student                 └──1:N──→ Parent
```

**Prisma schema**: MVP PRD(`학생관리시스템_.md`)에 정의된 스키마 그대로 채택.

---

## 5. API 엔드포인트 목록 (전체 28개)

### 인증 (4개)
```
POST   /api/auth/register              — 회원가입
POST   /api/auth/login                 — 로그인
POST   /api/auth/refresh               — 토큰 갱신
POST   /api/auth/logout                — 로그아웃
```

### 사용자 (2개)
```
GET    /api/users/me                   — 내 정보 조회
PATCH  /api/users/me                   — 내 정보 수정
```

### 수업 (5개)
```
GET    /api/classes                    — 수업 목록 (?date= 필터)
GET    /api/classes/:id                — 수업 상세
POST   /api/classes                    — 수업 생성
PATCH  /api/classes/:id                — 수업 수정
DELETE /api/classes/:id                — 수업 삭제
```

### 학생 (5개)
```
POST   /api/students                   — 학생 생성 (학부모 포함)
PATCH  /api/students/:id               — 학생 수정
DELETE /api/students/:id               — 학생 삭제
POST   /api/students/:id/parents       — 학부모 추가
DELETE /api/parents/:id                — 학부모 삭제
```

### 수업-학생 연결 (3개)
```
GET    /api/classes/:id/students       — 수업별 학생 목록
POST   /api/classes/:id/enroll         — 수업에 학생 등록
DELETE /api/classes/:cid/students/:sid  — 수업에서 학생 제거
```

### 수업 세션 (3개)
```
POST   /api/sessions                   — 수업 세션 생성 (종료 처리)
GET    /api/sessions/:id               — 세션 상세
GET    /api/classes/:id/sessions       — 수업별 세션 목록
```

### 출석 (3개)
```
POST   /api/attendance/bulk            — 출석 일괄 등록
PATCH  /api/attendance/:id             — 개별 출석 수정
GET    /api/sessions/:id/attendance    — 세션별 출석 현황
```

### 알림 (3개)
```
POST   /api/sessions/:id/preview-notification  — 알림 미리보기
POST   /api/sessions/:id/send-notification     — 알림 발송
GET    /api/notifications                      — 알림 발송 내역
```

### 대시보드 (1개)
```
GET    /api/dashboard/stats            — 대시보드 통계
```

---

## 6. 인증 흐름

```
[회원가입]
Client → POST /auth/register {email, password, name, phone}
       ← 201 {success: true}

[로그인]
Client → POST /auth/login {email, password}
       ← 200 {accessToken, refreshToken, user}
       → accessToken을 Zustand authStore에 저장
       → refreshToken을 httpOnly cookie 또는 localStorage에 저장

[인증 요청]
Client → GET /api/classes (Authorization: Bearer <accessToken>)
       → auth.middleware가 토큰 검증
       ← 200 (정상) 또는 401 (만료)

[토큰 갱신]
accessToken 만료(15분) → Axios interceptor가 자동 감지
       → POST /auth/refresh {refreshToken}
       ← 200 {accessToken} (새 토큰 발급)
       → 원래 요청 재시도

[로그아웃]
Client → POST /auth/logout
       → Zustand authStore 초기화, 토큰 삭제
```

### 토큰 정책

| 항목 | 값 |
|------|------|
| Access Token 만료 | 15분 |
| Refresh Token 만료 | 7일 |
| 알고리즘 | HS256 |
| Payload | { userId, email, role } |

---

## 7. 에러 응답 형식 (표준)

```typescript
// 성공 응답
{
  success: true,
  data: { ... }     // 또는 message: string
}

// 실패 응답
{
  success: false,
  message: string,  // 사용자 표시용 메시지
  errors?: [        // 유효성 검증 실패 시
    { field: string, message: string }
  ]
}
```

### HTTP 상태 코드

| 코드 | 용도 |
|------|------|
| 200 | 조회/수정 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 (유효성 검증 실패) |
| 401 | 인증 필요 (토큰 없음/만료) |
| 403 | 권한 없음 (다른 사용자의 리소스 접근) |
| 404 | 리소스 없음 |
| 409 | 충돌 (이메일 중복, 이미 등록된 학생 등) |
| 500 | 서버 내부 오류 |

---

## 8. 엣지케이스 및 가정

### 인증
- 인증 없는 요청 → 401 응답 + 프론트에서 `/login`으로 리다이렉트
- 토큰 만료 → Axios interceptor가 refresh 시도, 실패 시 로그아웃
- 비밀번호 규칙: 최소 8자, 영문 + 숫자 포함

### 빈 데이터 처리
- 수업 없음 → "아직 등록된 수업이 없습니다. 새 수업을 만들어보세요" 안내
- 학생 없음 → "학생을 추가해주세요" 안내
- 출석 기록 없음 → 전체 학생 '미체크' 상태로 표시

### 비즈니스 로직
- 수업 삭제 시 → CASCADE로 연관 데이터(학생 연결, 세션, 출석, 알림) 모두 삭제
- 학생 삭제 시 → CASCADE로 학부모, 출석 기록 삭제
- 중복 수강 등록 → 409 에러 (UNIQUE 제약)
- 정원 초과 시 → 400 에러 ("정원이 가득 찼습니다")
- 이미 알림 발송된 세션 → 재발송 확인 모달 표시

### 대용량 데이터
- 수업 세션 목록 → 페이지네이션 (기본 limit=10)
- 알림 내역 → 페이지네이션 (기본 limit=20)
- 학생 수는 MVP 기준 최대 100명 규모 → 페이지네이션 불필요

### 보안
- 선생님은 자신의 데이터만 접근 가능 (teacherId 기준 필터링)
- SQL Injection → Prisma ORM 사용으로 방지
- XSS → React 기본 이스케이핑 + 입력값 sanitize
- 비밀번호 → bcrypt 해싱 (saltRounds: 10)
- CORS → 프론트엔드 도메인만 허용

---

## 9. 프로젝트 구조 (최종)

```
01-학생관리/
├── frontend/                  # React 프론트엔드
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── backend/                   # Express 백엔드
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                      # 설계 문서
│   ├── TECH_STACK.md
│   ├── MVP_SCOPE.md
│   └── DB_ENTITIES.md
│
├── CLAUDE.md                  # HexStack 방법론
├── ARCHITECTURE.md            # 시스템 설계서 (본 파일)
├── PHASE_SUMMARY.md           # 단계별 완료 기록
└── .claude/skills/hexstack/   # 에이전트 스킬팩
```
