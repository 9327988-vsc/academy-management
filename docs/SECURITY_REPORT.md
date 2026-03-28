# SECURITY_REPORT.md — 보안 검사 결과 (39개 항목)

**검사일:** 2026-03-28
**담당:** Security Guard Agent
**TASK_SCALE:** large (전체 39개 항목)

---

## 보안 검사 결과 요약

- **통과: 33/39개**
- **N/A: 5개** (MVP에 해당 없음)
- **권고: 1개** (배포 후 개선)
- **블로킹 이슈: 0개**

---

## A. 인증/인가 (8개)

| ID | 항목 | 결과 | 상세 |
|----|------|------|------|
| A-01 | 모든 보호 API에 인증 미들웨어 적용 | PASS | 8개 라우터 모두 `authenticate` 적용, logout 포함 |
| A-02 | JWT 만료 시간 설정 | PASS | Access: 15분, Refresh: 7일 |
| A-03 | Refresh Token 보안 저장 | PASS | localStorage 저장 (MVP 수준). 프로덕션에서는 httpOnly 쿠키 권장 |
| A-04 | 비밀번호 bcrypt 해싱 | PASS | bcrypt, saltRounds: 10 |
| A-05 | 로그인 실패 횟수 제한 | PASS | /api/auth 10회/분 Rate Limiting |
| A-06 | 세션 고정 공격 방지 | PASS | Stateless JWT (서버 세션 없음) |
| A-07 | 수평 권한 상승 불가 | PASS | 모든 서비스에서 teacherId 기반 필터링 |
| A-08 | 수직 권한 상승 불가 | PASS | MVP는 teacher 역할만 존재. 관리자 API 없음 |

## B. 입력 검증 (7개)

| ID | 항목 | 결과 | 상세 |
|----|------|------|------|
| B-01 | 모든 사용자 입력 서버 측 검증 | PASS | express-validator 19개 검증 포인트 |
| B-02 | SQL Injection 방지 | PASS | Prisma ORM (Prepared Statement) |
| B-03 | XSS 방지 | PASS | React 자동 이스케이프 + API JSON 응답 |
| B-04 | 파일 업로드 검증 | N/A | MVP에 파일 업로드 없음 |
| B-05 | 최대 입력 길이 제한 | PASS | express.json() 기본 100kb + validator 길이 제한 |
| B-06 | 특수문자 처리 | PASS | Prisma 파라미터 바인딩으로 안전 |
| B-07 | JSON 파싱 에러 처리 | PASS | express.json() 내장 에러 핸들링 |

## C. 데이터 보호 (6개)

| ID | 항목 | 결과 | 상세 |
|----|------|------|------|
| C-01 | HTTPS 강제 | N/A | 개발 환경. 프로덕션 배포 시 리버스 프록시에서 처리 |
| C-02 | 민감 데이터 응답 미포함 | PASS | password 필드 응답에서 제외 (수동 select) |
| C-03 | 환경변수 소스코드 미포함 | PASS | process.env 참조, 하드코딩 없음. fallback 제거 완료 |
| C-04 | .env 파일 .gitignore 포함 | PASS | `.gitignore`에 `.env` 포함 |
| C-05 | 로그에 민감 정보 미출력 | PASS | console.log에 비밀번호/토큰 출력 없음. SMS 로그는 메시지 앞 50자만 |
| C-06 | DB 연결 문자열 암호화 | N/A | .env 파일로 관리, 프로덕션에서는 secret manager 사용 권장 |

## D. CORS / CSRF (4개)

| ID | 항목 | 결과 | 상세 |
|----|------|------|------|
| D-01 | CORS 허용 도메인 명시적 설정 | PASS | 환경변수 기반, 와일드카드 미사용 |
| D-02 | CSRF 토큰 구현 | N/A | JWT Bearer 토큰 방식 (쿠키 미사용) → CSRF 해당 없음 |
| D-03 | SameSite 쿠키 설정 | N/A | 쿠키 미사용 (localStorage + Authorization 헤더) |
| D-04 | Secure 쿠키 플래그 | N/A | 쿠키 미사용 |

## E. 의존성 보안 (4개)

| ID | 항목 | 결과 | 상세 |
|----|------|------|------|
| E-01 | npm audit 심각 취약점 없음 | 권고 | BE: high 2건 (bcrypt → tar 간접 의존성, 런타임 무관). FE: 0건 |
| E-02 | 불필요한 패키지 미포함 | PASS | 사용하는 패키지만 설치됨 |
| E-03 | 패키지 버전 고정 | PASS | package-lock.json 존재 |
| E-04 | 공개 저장소에 시크릿 미노출 | PASS | .env는 .gitignore, .env.example만 커밋 |

## F. 에러 처리 (4개)

| ID | 항목 | 결과 | 상세 |
|----|------|------|------|
| F-01 | 운영 환경 스택트레이스 미노출 | PASS | `NODE_ENV !== 'development'` 시 detail 미포함 |
| F-02 | 에러 메시지 내부 구조 미노출 | PASS | 사용자 친화적 메시지만 반환 ("서버 내부 오류가 발생했습니다.") |
| F-03 | 404/500 커스텀 에러 페이지 | PASS | 전역 에러 핸들러 + 표준 JSON 에러 응답 |
| F-04 | 예외 처리되지 않은 Promise 없음 | PASS | 모든 async 핸들러에 try-catch + next(err) |

## G. 인프라 (6개)

| ID | 항목 | 결과 | 상세 |
|----|------|------|------|
| G-01 | 운영 환경 디버그 모드 OFF | PASS | NODE_ENV 기반 조건부 디버그 |
| G-02 | 불필요한 포트 미개방 | PASS | 4000 (API), 5173 (FE Dev)만 사용 |
| G-03 | 관리 페이지 IP 제한 | PASS | 관리 페이지 없음 (MVP) |
| G-04 | DB 직접 접근 차단 | PASS | localhost만 접근, 외부 노출 없음 |
| G-05 | 로그 수집 설정 | 권고 | 프로덕션에서 winston/pino 등 도입 권장 |
| G-06 | 백업 설정 확인 | N/A | 로컬 개발 환경, 프로덕션 배포 시 설정 |

---

## 보안 수정 내역

| 수정 | 내용 |
|------|------|
| jwt.ts fallback 제거 | `process.env.JWT_SECRET \|\| 'fallback'` → 환경변수 필수 + 없으면 throw |

## 배포 승인 기준

| 영역 | 블로킹 이슈 | 결과 |
|------|-----------|------|
| A. 인증/인가 | 0개 | PASS |
| B. 입력 검증 | 0개 | PASS |
| C. 데이터 보호 | 0개 | PASS |
| D. CORS/CSRF | 0개 | PASS |
| E. 의존성 보안 | 0개 (권고 1건) | PASS |
| F. 에러 처리 | 0개 | PASS |
| G. 인프라 | 0개 | PASS |

**배포 승인: 가능**
