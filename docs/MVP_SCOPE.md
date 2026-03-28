# MVP 범위 정의 (MVP_SCOPE)

**프로젝트:** Academy Smart Management System (ASMS)
**작성일:** 2026-03-28
**TASK_SCALE:** large
**MVP 철학:** "선생님이 수업 후 학생/학부모에게 알림을 쉽게 보낼 수 있다"

---

## MVP 핵심 기능 (Must Have) — 6개

### 1. 사용자 인증
- 선생님 회원가입 (이메일, 비밀번호, 이름, 전화번호)
- 로그인 / 로그아웃 (JWT 기반)
- 비밀번호 암호화 (bcrypt)
- 인증 미들웨어 (토큰 검증)

**화면:** `/login`, `/signup`
**API:** `POST /api/auth/register`, `POST /api/auth/login`

### 2. 수업 관리 (CRUD)
- 수업 생성 (수업명, 과목, 요일, 시간, 교실, 정원)
- 수업 목록 조회 (선생님 본인 수업만)
- 수업 수정 / 삭제

**화면:** `/classes`, 수업 생성 모달
**API:** `GET/POST /api/classes`, `GET/PUT/DELETE /api/classes/:id`

### 3. 학생 관리 (CRUD)
- 학생 추가 (이름, 학년, 학교, 전화번호)
- 학부모 정보 연동 (이름, 관계, 전화번호)
- 수업별 학생 목록 관리
- 학생 수정 / 삭제

**화면:** `/classes/:id/students`, 학생 추가 모달
**API:** `GET/POST /api/classes/:id/students`, `PUT/DELETE /api/students/:id`

### 4. 출결 관리
- 수업 세션 생성 (날짜, 진도, 숙제 입력)
- 학생별 출석/결석/지각 체크
- 출석 기록 조회

**화면:** `/classes/:id/attendance`
**API:** `POST /api/sessions`, `POST /api/sessions/:id/attendance`

### 5. SMS 알림 발송
- 수업 종료 후 알림 메시지 자동 생성
- 출석/결석 학생 분류 메시지
- 학부모 통합 알림
- 알림 미리보기 후 발송
- 발송 로그 관리

**화면:** 수업 종료 처리 화면
**API:** `POST /api/sessions/:id/notify`, `GET /api/notifications`

### 6. 대시보드
- 오늘 수업 목록 표시
- 전체 학생 수 통계
- 최근 알림 발송 현황

**화면:** `/dashboard`
**API:** `GET /api/dashboard/stats`, `GET /api/classes?date=today`

---

## MVP 제외 기능 (Not Now)

| 기능 | 도입 예정 | 사유 |
|------|-----------|------|
| 보강 관리 시스템 | Phase 2 | 복잡한 일정 로직 |
| AI 문제 풀이 (Claude API) | Phase 3 | 외부 API 의존 |
| 학생/학부모 로그인 | Phase 2 | 역할 확장 필요 |
| 카카오 알림톡 | Phase 2 | 사업자 인증 필요 |
| 캘린더 뷰 | Phase 2 | UI 복잡도 높음 |
| 통계/분석 대시보드 | Phase 2 | 데이터 축적 필요 |
| 파일 첨부 | Phase 3 | S3 연동 필요 |
| 결제 관리 | Phase 3 | 별도 PG 연동 |
| 성적 관리 | Phase 3 | 추가 스키마 필요 |

---

## MVP 사용자 역할

| 역할 | MVP 포함 | 기능 |
|------|----------|------|
| 선생님 (teacher) | O | 모든 MVP 기능 |
| 학부모 (parent) | X | 알림 수신만 (SMS) |
| 학생 (student) | X | 해당 없음 |
| 원장 (admin) | X | Phase 2 이후 |

---

## MVP 화면 목록 (8개)

| # | 경로 | 화면명 | 인증 필요 |
|---|------|--------|-----------|
| 1 | `/login` | 로그인 | X |
| 2 | `/signup` | 회원가입 | X |
| 3 | `/dashboard` | 대시보드 | O |
| 4 | `/classes` | 수업 목록 | O |
| 5 | `/classes/:id` | 수업 상세 | O |
| 6 | `/classes/:id/students` | 학생 관리 | O |
| 7 | `/classes/:id/attendance` | 출결 관리 | O |
| 8 | `/classes/:id/sessions/:sid/notify` | 알림 발송 | O |

---

## 성공 기준

1. 선생님이 수업 생성 → 학생 등록 → 출석 체크 → 알림 발송까지 **5분 이내** 완료
2. 알림 발송 후 학부모가 SMS로 수업 내용을 **즉시 수신**
3. 결석 학생 자동 감지 및 별도 메시지 발송
4. 모바일 반응형 UI (선생님이 수업 중 태블릿/폰으로 사용 가능)

---

## 개발 페이즈 로드맵

```
Phase 1 (MVP) — 6주
├── 사용자 인증
├── 수업 CRUD
├── 학생 CRUD + 학부모 정보
├── 출결 관리
├── SMS 알림 발송
└── 대시보드

Phase 2 — 4주
├── 보강 관리
├── 학부모 포털 (로그인/조회)
├── 카카오 알림톡
├── 캘린더 뷰
└── 통계/분석

Phase 3 — 4주
├── AI 문제 풀이 (Claude API)
├── 결제 관리
├── 성적 관리
├── 파일 첨부 (S3)
└── 앱 푸시 알림 (FCM)
```
