# 보안 검사 결과 -- 보강 시스템 (v2)

## 요약
- 검사 항목: 39개
- 통과: 33개
- N/A: 2개
- 블로킹 이슈: 1개 (수정 완료)
- 권고 사항: 3개

## 영역별 결과
| 영역 | 항목 수 | 통과 | N/A | 블로킹 | 권고 |
|------|--------|------|-----|--------|------|
| A. 인증/인가 | 8 | 7 | 0 | 0 | 1 |
| B. 입력 검증 | 7 | 6 | 1 | 0 | 0 |
| C. 데이터 보호 | 6 | 5 | 0 | 1 (수정완료) | 0 |
| D. CORS/CSRF | 4 | 3 | 0 | 0 | 1 |
| E. 의존성 보안 | 4 | 4 | 0 | 0 | 0 |
| F. 에러 처리 | 4 | 3 | 0 | 0 | 1 |
| G. 인프라 | 6 | 5 | 1 | 0 | 0 |

---

## 상세 검사 결과

### A. 인증/인가 (8개)

**A-01: 보강 API 인증 미들웨어** -- PASS
- `makeup.routes.ts` 최상단에 `router.use(authenticate)` 적용, 모든 경로에 JWT 인증 강제

**A-02: JWT 만료 설정** -- PASS
- 기존 인프라 유지, 보강 코드에서 변경 없음

**A-03: Refresh 토큰 보안** -- PASS
- 기존 인프라 유지, `client.ts` 인터셉터에서 자동 갱신 처리 정상

**A-04: 비밀번호 해싱** -- PASS
- 보강 코드에서 비밀번호 관련 로직 없음, 기존 인프라 변경 없음

**A-05: Rate Limiting** -- PASS
- `app.ts`의 전역 rate limiter (`/api` 경로, 60초 100요청)가 `/api/makeup` 경로에도 적용됨

**A-06: 세션 고정 방지** -- PASS
- JWT 기반 인증, 세션 사용하지 않음

**A-07: 수평적 권한 상승 (Horizontal Privilege Escalation)** -- PASS
- **강사 슬롯 격리**: `getSlots()`에서 TEACHER 역할일 때 자신의 teacherId만 필터링, `updateSlot()`/`deleteSlot()`에서 `slot.teacherId !== teacherId` 검증
- **학생 신청 격리**: `getRequests()`에서 STUDENT 역할일 때 자신의 studentId만 필터링, `createRequest()`에서 학생 본인 확인
- **학부모 격리**: `getRequests()`에서 PARENT 역할일 때 자녀 studentId 목록으로 필터링, `getAvailableSlots()`에서 자녀 소유 검증

**A-08: 수직적 권한 상승 (Vertical Privilege Escalation)** -- 권고
- 슬롯 CRUD: `authorize('TEACHER', 'ADMIN')` 적용 -- PASS
- 신청 생성: `authorize('STUDENT', 'PARENT', 'TEACHER', 'ADMIN')` 적용 -- PASS
- 대기 신청 조회: `authorize('TEACHER', 'ADMIN')` 적용 -- PASS
- 상태 변경: `authorize('TEACHER', 'ADMIN', 'STUDENT', 'PARENT')` 적용, 서비스 레이어에서 action별 역할 검증 -- PASS
- **권고**: 신청 목록 조회(`GET /requests`)에 `authorize` 미들웨어 없음. `authenticate`만 적용되어 있고 서비스 레이어에서 role 기반 데이터 격리를 수행하므로 데이터 유출은 없지만, 방어 심층(defense-in-depth) 차원에서 `authorize`를 추가하는 것을 권고

---

### B. 입력 검증 (7개)

**B-01: 서버사이드 입력 검증** -- PASS
- 모든 라우트에 `express-validator` 검증 규칙 + `validate` 미들웨어 적용
- 슬롯 생성: slotDate(ISO8601), startTime/endTime(HH:mm), maxStudents(1-20), classId(int), isRecurring(boolean), recurringDay(enum)
- 신청 생성: studentId(int), originalAttendanceId(int), slotId(int), studentNote(max 500)
- 상태 변경: action(enum), teacherNote(max 500)
- 조회 쿼리: 모든 필터 파라미터에 타입 검증

**B-02: SQL Injection** -- PASS
- Prisma ORM만 사용, `$queryRaw`/`$executeRaw` 미사용 확인

**B-03: XSS 방지** -- PASS
- React 기본 이스케이핑 사용, `dangerouslySetInnerHTML`/`innerHTML` 미사용 확인
- 서버 응답은 JSON 형식, 사용자 입력(studentNote, teacherNote)이 HTML로 렌더링되지 않음
- FE에서 `{req.studentNote}` 형태로 React JSX 내에서 안전하게 출력

**B-04: 파일 업로드 검증** -- N/A
- 보강 시스템에 파일 업로드 기능 없음

**B-05: 최대 입력 길이 제한** -- PASS
- studentNote: 500자 (`isLength({ max: 500 })`)
- teacherNote: 500자 (`isLength({ max: 500 })`)
- DB 레벨에서 `@db.Text` 타입이지만 라우트 검증에서 500자 제한

**B-06: 특수 문자 처리** -- PASS
- `.trim()` 적용으로 앞뒤 공백 제거
- Prisma가 파라미터 바인딩으로 특수 문자 안전하게 처리

**B-07: JSON 파싱 에러 처리** -- PASS
- Express `express.json()` 미들웨어가 잘못된 JSON에 대해 400 에러 반환

---

### C. 데이터 보호 (6개)

**C-01: HTTPS 강제** -- PASS
- 배포 환경(Railway/Vercel)에서 HTTPS 강제, 앱 레벨 책임 아님

**C-02: 민감 데이터 응답 제외** -- PASS
- 서비스 레이어에서 명시적 select/map으로 필요한 필드만 반환
- password, 내부 userId 등 민감 필드 노출 없음
- 학생 phone은 `getPendingRequests()`에서 강사에게만 노출 (정당한 비즈니스 요구)

**C-03: 소스코드 내 환경변수 하드코딩** -- PASS
- 보강 코드에서 환경변수 하드코딩 없음
- `.env.example`은 플레이스홀더 값만 포함

**C-04: .env gitignore** -- PASS
- `.gitignore`에 `.env`, `.env.local`, `.env.production.local` 포함 확인

**C-05: 로그에 민감 정보 없음** -- PASS (수정 완료)
- **발견**: `handleError()`에서 `console.error('Error:', error)` 호출 시 프로덕션 환경에서도 전체 에러 객체(Prisma 쿼리 포함 가능)를 로깅
- **수정**: 프로덕션 환경에서는 `error.message`만 로깅하도록 변경

**C-06: DB 연결 문자열 비노출** -- PASS
- `DATABASE_URL`은 `env("DATABASE_URL")`로 환경변수에서 읽음

---

### D. CORS/CSRF (4개)

**D-01: CORS 도메인 명시** -- PASS
- `app.ts`에서 `CORS_ORIGIN` 환경변수로 설정, 기본값 `http://localhost:5173`

**D-02: CSRF 방어** -- 권고
- JWT Bearer 토큰 기반 인증이므로 쿠키 기반 CSRF 공격에 해당 없음
- 단, `credentials: true` 설정이 있으므로 쿠키가 활용될 경우 CSRF 토큰 추가 권고

**D-03: SameSite 쿠키 설정** -- PASS
- 쿠키 기반 인증 미사용 (localStorage + Bearer 토큰 방식)

**D-04: Secure 쿠키 플래그** -- PASS
- 쿠키 기반 인증 미사용

---

### E. 의존성 보안 (4개)

**E-01: 취약 의존성** -- PASS
- 보강 시스템에서 신규 의존성 추가 없음 (기존 express-validator, prisma 사용)

**E-02: 불필요 패키지** -- PASS
- 보강 시스템에서 불필요한 패키지 추가 없음

**E-03: package-lock.json 존재** -- PASS
- backend/package-lock.json, frontend/package-lock.json 모두 존재 확인

**E-04: 소스코드 내 시크릿** -- PASS
- backend/src 내 하드코딩된 password, secret, api_key 없음 확인

---

### F. 에러 처리 (4개)

**F-01: 프로덕션 스택 트레이스 비노출** -- PASS (수정 완료)
- **발견**: `handleError()`에서 비-AppError의 `error.message`를 프로덕션에서도 클라이언트에 반환 (Prisma 내부 에러 메시지 포함 가능)
- **수정**: 프로덕션 환경에서는 `'서버 내부 오류가 발생했습니다.'` 반환, 개발 환경에서만 `error.message` 반환
- 수정 파일: `backend/src/utils/error.utils.ts`

**F-02: 내부 구조 비노출 에러 메시지** -- PASS
- AppError는 개발자가 작성한 한국어 메시지만 반환
- 수정 후 비-AppError도 일반 메시지만 반환

**F-03: 커스텀 에러 페이지** -- PASS
- `errorHandler` 미들웨어에서 일관된 JSON 응답 반환

**F-04: 미처리 Promise 거부** -- 권고
- 모든 컨트롤러가 try/catch로 감싸져 있어 대부분 안전
- 그러나 `asyncHandler` 유틸이 존재하지만 사용되지 않음. Express 5 이전 버전에서는 async 함수의 에러가 자동으로 next()로 전달되지 않으므로, 향후 리팩토링 시 `asyncHandler` 래핑 또는 Express 5 업그레이드 권고

---

### G. 인프라 (6개)

**G-01: 프로덕션 디버그 모드** -- PASS
- `error.middleware.ts`에서 `NODE_ENV === 'development'`일 때만 상세 에러 출력

**G-02: 불필요 포트** -- PASS
- 보강 시스템에서 추가 포트 오픈 없음

**G-03: 관리자 페이지 IP 제한** -- N/A
- 현재 단일 서비스 아키텍처, 별도 관리자 페이지 없음

**G-04: DB 직접 접근 차단** -- PASS
- Railway 내부 네트워크 사용 (`mysql.railway.internal`)

**G-05: 로그 수집 설정** -- PASS
- 기존 인프라 유지

**G-06: 백업 설정** -- PASS
- 기존 인프라 유지

---

## 블로킹 이슈 (배포 전 필수 해결)

- **[F-01/C-05] `handleError()`에서 프로덕션 환경 정보 유출** -- **수정 완료**
  - 문제: 비-AppError 발생 시 `error.message` (Prisma 내부 에러 등)를 클라이언트 응답과 로그에 그대로 노출
  - 수정: `backend/src/utils/error.utils.ts`에서 프로덕션 환경 분기 추가
  - 클라이언트 응답: 프로덕션에서 일반 메시지만 반환
  - 로그: 프로덕션에서 `error.message`만 로깅 (전체 객체 X)

---

## 권고 사항 (배포 후 개선)

- **[A-08] `GET /makeup/requests` 경로에 `authorize` 미들웨어 추가**
  - 현재 서비스 레이어에서 role 기반 데이터 격리를 수행하므로 실질적 위험은 없으나, defense-in-depth 원칙에 따라 라우트 레벨에서도 명시적 역할 제한 추가 권고

- **[D-02] CSRF 토큰 도입 검토**
  - 현재 Bearer 토큰 방식이므로 CSRF 위험은 낮으나, `credentials: true` 설정이 있으므로 향후 쿠키 인증 전환 시 CSRF 방어 필수

- **[F-04] `asyncHandler` 래핑 또는 Express 5 업그레이드**
  - 현재 try/catch로 안전하지만, 체계적 에러 전파를 위해 `asyncHandler` 유틸 활용 권고

---

## 비즈니스 로직 보안 특별 검사

### 1. 데이터 격리 -- PASS
- 강사: 자신의 슬롯만 CRUD 가능 (teacherId 검증)
- 학생: 자신의 신청만 조회/취소 가능 (userId -> studentId 매핑)
- 학부모: 자녀의 신청만 조회 가능 (parent.students 매핑)
- ADMIN: 전체 접근 가능 (적절한 설계)

### 2. 비즈니스 규칙 보안 -- PASS
- 자기 승인 방지: 학생/학부모는 APPROVE/REJECT/COMPLETE 액션 불가 (service 레이어에서 role 검증)
- 상태 전이 규칙: `validTransitions` 맵으로 허용된 전이만 가능 (CANCELLED -> APPROVED 불가)
- FULL 슬롯 초과 방지: 트랜잭션 내에서 `currentCount >= maxStudents` 재검증 (TOCTOU 방지)
- 취소된 신청 재승인 방지: CANCELLED 상태에서의 전이 없음

### 3. 트랜잭션 안전성 -- PASS
- `createRequest()`: `$transaction`으로 중복 검사 + 슬롯 검증 + 생성 원자적 수행
- `updateRequestStatus()`: `$transaction`으로 상태 재검증 + 변경 + currentCount 동기화 원자적 수행
- `deleteSlot()`: `$transaction`으로 PENDING 신청 취소 + 슬롯 삭제 원자적 수행

---

## 배포 승인
- A~D 영역 블로킹 이슈: 0개 (1개 수정 완료) -> **PASS**
- E~G 영역 블로킹 이슈: 0개 -> **PASS**

> **결론: 배포 승인 -- 블로킹 이슈 모두 해결 완료, 권고 사항 3건은 배포 후 개선**
