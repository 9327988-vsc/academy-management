# 로컬 개발 환경 실행 가이드

**프로젝트:** Academy Smart Management System (ASMS)
**마지막 업데이트:** 2026-03-28

---

## 사전 요구사항

| 도구 | 버전 | 확인 명령어 |
|------|------|------------|
| Node.js | 20 LTS 이상 | `node -v` |
| npm | 9 이상 | `npm -v` |
| MySQL | 8.0 이상 | `mysql --version` |
| Git | 최신 | `git --version` |

---

## 1. 프로젝트 구조

```
01-학생관리/
├── backend/          # Express API 서버 (포트 4000)
│   ├── src/          # 소스 코드
│   ├── prisma/       # DB 스키마 + 마이그레이션
│   ├── .env          # 환경변수 (직접 생성 필요)
│   └── .env.example  # 환경변수 템플릿
│
├── frontend/         # React 프론트엔드 (포트 5173)
│   └── src/          # 소스 코드
│
└── docs/             # 설계 문서
```

---

## 2. 데이터베이스 설정

### MySQL 접속
```bash
mysql -u root -p
```

### academy 데이터베이스 생성
```sql
CREATE DATABASE IF NOT EXISTS academy
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

SHOW DATABASES;
EXIT;
```

---

## 3. 백엔드 설정

### 3-1. 의존성 설치
```bash
cd backend
npm install
```

### 3-2. 환경변수 설정
`.env.example`을 복사하여 `.env` 파일을 생성합니다:

```bash
cp .env.example .env
```

`.env` 파일을 열고 MySQL 비밀번호를 수정합니다:

```env
# Database — 비밀번호에 특수문자(@)가 있으면 URL 인코딩 필요
# @ → %40
DATABASE_URL="mysql://root:YourPassword@localhost:3306/academy"

# JWT — 프로덕션에서는 반드시 변경
JWT_SECRET="your-jwt-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-in-production"

# Server
PORT=4000
NODE_ENV=development

# CORS
CORS_ORIGIN="http://localhost:5173"
```

### 3-3. Prisma 설정 및 마이그레이션
```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 테이블 생성
npx prisma migrate dev

# (선택) 테스트 데이터 삽입
npx ts-node prisma/seed.ts
```

### 3-4. 백엔드 서버 실행
```bash
npm run dev
```

정상 실행 시 출력:
```
[ASMS] Server running on http://localhost:4000
[ASMS] Environment: development
```

### 3-5. API 동작 확인
```bash
curl http://localhost:4000/api/health
# {"success":true,"message":"ASMS API is running"}
```

---

## 4. 프론트엔드 설정

### 4-1. 의존성 설치
```bash
cd frontend
npm install
```

### 4-2. 프론트엔드 서버 실행
```bash
npm run dev
```

정상 실행 시 출력:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

---

## 5. 접속 및 사용

| 서비스 | URL | 용도 |
|--------|-----|------|
| 프론트엔드 | http://localhost:5173 | 웹 애플리케이션 |
| 백엔드 API | http://localhost:4000/api | REST API |
| Prisma Studio | `npx prisma studio` | DB GUI 관리 도구 |

### 초기 계정 (시드 데이터 실행 시)

| 항목 | 값 |
|------|------|
| 이메일 | teacher@academy.com |
| 비밀번호 | test1234 |
| 이름 | 김선생 |
| 역할 | teacher |

시드 데이터를 실행하지 않은 경우, http://localhost:5173/signup 에서 회원가입 후 사용하세요.

---

## 6. 개발 워크플로우

### 일반적인 개발 흐름

```bash
# 터미널 1 — 백엔드
cd backend && npm run dev

# 터미널 2 — 프론트엔드
cd frontend && npm run dev
```

### DB 스키마 변경 시

```bash
cd backend

# 1. prisma/schema.prisma 파일 수정
# 2. 마이그레이션 생성 및 적용
npx prisma migrate dev --name describe_change

# 3. Prisma Client 자동 재생성됨
```

### 타입 체크

```bash
# 백엔드
cd backend && npx tsc --noEmit

# 프론트엔드
cd frontend && npx tsc --noEmit
```

---

## 7. 주요 npm 스크립트

### Backend

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (ts-node-dev, 자동 재시작) |
| `npm run build` | TypeScript 컴파일 |
| `npm start` | 프로덕션 서버 실행 |
| `npm run prisma:generate` | Prisma 클라이언트 생성 |
| `npm run prisma:migrate` | DB 마이그레이션 실행 |
| `npm run prisma:seed` | 시드 데이터 삽입 |
| `npm run prisma:studio` | Prisma Studio (DB GUI) |

### Frontend

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (Vite HMR) |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
