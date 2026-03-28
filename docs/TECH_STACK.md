# 기술 스택 상세 (TECH_STACK)

**프로젝트:** Academy Smart Management System (ASMS)
**작성일:** 2026-03-28
**단계:** Phase 1 기획 확정

---

## Frontend

| 기술 | 버전 | 용도 |
|------|------|------|
| React | 18.3+ | UI 라이브러리 |
| Vite | 5.0 | 빌드 도구 (HMR, 빠른 번들링) |
| TypeScript | 5.x | 타입 안전성 |
| React Router | 6.x | SPA 라우팅 |
| Tailwind CSS | 3.4 | 유틸리티 기반 스타일링 |
| shadcn/ui | latest | UI 컴포넌트 라이브러리 |
| Axios | 1.x | HTTP 클라이언트 |
| React Hook Form | 7.x | 폼 상태 관리 |
| Zustand | 4.x | 전역 상태 관리 (경량) |
| React Query (TanStack Query) | 5.x | 서버 상태 관리/캐싱 |
| date-fns | 3.x | 날짜 처리 |

### Frontend 디렉토리 구조 (예정)
```
frontend/
├── src/
│   ├── components/     # 공용 컴포넌트
│   │   └── ui/         # shadcn/ui 컴포넌트
│   ├── pages/          # 페이지 컴포넌트
│   ├── hooks/          # 커스텀 훅
│   ├── lib/            # 유틸리티
│   ├── api/            # API 호출 함수
│   ├── stores/         # Zustand 스토어
│   ├── types/          # TypeScript 타입 정의
│   └── App.tsx
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Backend

| 기술 | 버전 | 용도 |
|------|------|------|
| Node.js | 20 LTS | 런타임 |
| Express.js | 4.19 | 웹 프레임워크 |
| TypeScript | 5.x | 타입 안전성 |
| Prisma | 5.x | ORM (타입 안전 쿼리) |
| MySQL | 8.0.45 | RDBMS |
| JWT (jsonwebtoken) | 9.x | 인증 토큰 |
| bcrypt | 5.x | 비밀번호 해싱 |
| node-cron | 3.x | 스케줄링 (알림 발송 등) |
| Nodemailer | 6.x | 이메일 발송 (MVP 후) |
| dotenv | 16.x | 환경변수 관리 |
| cors | 2.x | CORS 설정 |
| express-validator | 7.x | 입력 검증 |

### Backend 디렉토리 구조 (예정)
```
backend/
├── src/
│   ├── routes/         # 라우트 정의
│   ├── controllers/    # 요청 핸들러
│   ├── services/       # 비즈니스 로직
│   ├── middleware/      # 인증, 에러 핸들링
│   ├── utils/          # 유틸리티
│   ├── types/          # TypeScript 타입
│   └── app.ts          # Express 앱 설정
├── prisma/
│   └── schema.prisma   # DB 스키마
├── tsconfig.json
└── .env
```

---

## 데이터베이스

| 항목 | 값 |
|------|------|
| RDBMS | MySQL 8.0.45 |
| 호스트 | localhost:3306 |
| DB명 | academy |
| 문자셋 | utf8mb4_unicode_ci |
| ORM | Prisma 5.x |
| 마이그레이션 | Prisma Migrate |

---

## 외부 서비스 (MVP 후 단계적 도입)

| 서비스 | 용도 | 도입 시점 |
|------|------|------|
| NHN Cloud SMS API | 문자 알림 발송 | Phase 2 |
| Kakao Business API | 알림톡 발송 | Phase 3 |
| Anthropic Claude API | AI 문제 풀이 | Phase 3 |
| Firebase Cloud Messaging | 푸시 알림 | Phase 3 |

---

## 개발 도구

| 도구 | 용도 |
|------|------|
| Git | 버전 관리 |
| ESLint + Prettier | 코드 품질/포맷팅 |
| Prisma Studio | DB GUI 관리 |
| Postman / Thunder Client | API 테스트 |

---

## TypeScript 적용 범위

- **Frontend**: 전체 적용 (strict mode)
- **Backend**: 전체 적용 (strict mode)
- **Prisma**: 자동 타입 생성 → FE/BE 공유 가능

---

## 환경 변수 구조 (.env)

```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/academy"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Server
PORT=4000
NODE_ENV=development

# Frontend
VITE_API_URL="http://localhost:4000/api"
```
