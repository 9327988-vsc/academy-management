# Academy Smart Management System (ASMS)

학원 선생님을 위한 수업 관리 + 출결 체크 + 알림 발송 시스템

---

## 빠른 시작

### 최초 1회 설정
1. `setup-first-time.bat` 더블클릭
2. 설치 완료 대기 (약 3-5분)
3. `.env` 파일 확인 (`backend/.env`에 DATABASE_URL 설정 필요)

### 서버 실행

**방법 1: 전체 실행 (권장)**
- `start-all.bat` 더블클릭
- 백엔드 + 프론트엔드 자동 실행

**방법 2: 개별 실행**
- `start-backend.bat` — 백엔드만 실행
- `start-frontend.bat` — 프론트엔드만 실행

### 접속
- 프론트엔드: http://localhost:5173
- 백엔드 API: http://localhost:4000

### 서버 종료
각 터미널 창에서 `Ctrl + C` 누르기

---

## 핵심 기능

- **수업 관리** — 수업 생성/수정/삭제, 요일/시간 설정
- **학생 관리** — 학생 등록, 학부모 정보 연동
- **출결 관리** — 출석/결석/지각 체크
- **알림 발송** — 수업 종료 후 학부모에게 맞춤 알림 (MVP: 콘솔 로그)
- **대시보드** — 오늘 수업, 학생 수, 최근 기록

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Express.js, TypeScript, Prisma ORM |
| Database | MySQL 8.0 |
| Auth | JWT (Access + Refresh Token) |

## 빠른 시작

```bash
# 1. 백엔드 설정
cd backend
cp .env.example .env    # .env 수정 (MySQL 비밀번호)
npm install
npx prisma generate
npx prisma migrate dev
npx ts-node prisma/seed.ts   # 테스트 데이터 (선택)

# 2. 프론트엔드 설정
cd ../frontend
npm install

# 3. 실행 (각각 별도 터미널)
cd backend && npm run dev     # http://localhost:4000
cd frontend && npm run dev    # http://localhost:5173
```

## 테스트 계정

| 항목 | 값 |
|------|------|
| 이메일 | teacher@academy.com |
| 비밀번호 | test1234 |

시드 데이터 미실행 시 http://localhost:5173/signup 에서 회원가입

## 문서

| 문서 | 설명 |
|------|------|
| [LOCAL_SETUP.md](LOCAL_SETUP.md) | 로컬 실행 가이드 (상세) |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | 문제 해결 가이드 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 시스템 설계서 |
| [PHASE_SUMMARY.md](PHASE_SUMMARY.md) | 개발 단계별 기록 |
| [docs/API_SPEC.md](docs/API_SPEC.md) | API 28개 상세 명세 |
| [docs/DESIGN.md](docs/DESIGN.md) | UI 디자인 시스템 |
| [docs/SCHEMA.md](docs/SCHEMA.md) | DB 스키마 설계 |

## API 엔드포인트 (29개)

```
POST   /api/auth/register         회원가입
POST   /api/auth/login            로그인
POST   /api/auth/refresh          토큰 갱신
POST   /api/auth/logout           로그아웃
GET    /api/users/me              내 정보
PATCH  /api/users/me              내 정보 수정
GET    /api/classes               수업 목록
GET    /api/classes/:id           수업 상세
POST   /api/classes               수업 생성
PATCH  /api/classes/:id           수업 수정
DELETE /api/classes/:id           수업 삭제
GET    /api/classes/:id/students  수업별 학생
POST   /api/classes/:id/enroll    학생 등록
DELETE /api/classes/:cid/students/:sid  학생 제거
GET    /api/classes/:id/sessions  수업별 세션
POST   /api/students              학생 생성
PATCH  /api/students/:id          학생 수정
DELETE /api/students/:id          학생 삭제
POST   /api/students/:id/parents  학부모 추가
DELETE /api/parents/:id           학부모 삭제
POST   /api/sessions              세션 생성
GET    /api/sessions/:id          세션 상세
GET    /api/sessions/:id/attendance       출석 현황
POST   /api/sessions/:id/preview-notification  알림 미리보기
POST   /api/sessions/:id/send-notification     알림 발송
POST   /api/attendance/bulk       출석 일괄 등록
PATCH  /api/attendance/:id        출석 수정
GET    /api/notifications         알림 내역
GET    /api/dashboard/stats       대시보드 통계
```

## 프로젝트 구조

```
├── backend/
│   ├── src/
│   │   ├── routes/         8개 라우트
│   │   ├── controllers/    8개 컨트롤러
│   │   ├── services/       7개 서비스
│   │   ├── middleware/      인증, 검증, 에러
│   │   └── utils/          JWT, bcrypt, Prisma
│   └── prisma/             스키마, 마이그레이션, 시드
│
├── frontend/
│   └── src/
│       ├── pages/          8개 페이지
│       ├── components/     shadcn/ui + 커스텀
│       ├── api/            API 호출 함수
│       ├── stores/         Zustand 상태 관리
│       └── types/          TypeScript 타입
│
└── docs/                   설계/검수 문서
```
