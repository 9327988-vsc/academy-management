# BE 검수 결과

**검수일:** 2026-03-28
**담당:** BE Review Agent

---

## 심각 (즉시 수정 필요) — 4건 → 모두 수정 완료

| # | 파일 | 문제 | 상태 |
|---|------|------|------|
| 1 | 8개 서비스/컨트롤러 | PrismaClient 인스턴스 중복 생성 → 싱글톤 패턴 적용 | 수정 완료 |
| 2 | auth.routes.ts:41 | logout에 인증 미들웨어 누락 | 수정 완료 |
| 3 | attendance.routes.ts:23 | PATCH /attendance/:id 입력 검증 누락 | 수정 완료 |
| 4 | class.routes.ts:28, student.routes.ts:21 | PATCH 입력 검증 누락 | 수정 완료 |

## 보안 경고 — 0건

| 항목 | 상태 |
|------|------|
| SQL Injection | Prisma ORM 사용 — 안전 |
| 인증 미적용 엔드포인트 | 모든 보호 라우트에 authenticate 미들웨어 적용됨 |
| 비밀번호 응답 노출 | login/getMe 모두 password 필드 제외 — 안전 |
| CORS 설정 | 환경변수 기반 origin 제한 — 적절 |
| Rate Limiting | /api (100/min), /api/auth (10/min) — 적용됨 |
| 입력 검증 | express-validator 적용 (register, login, class, student, session, attendance) |
| 환경변수 관리 | .env 파일 + .gitignore — 하드코딩 없음 |

## 경고 (수정 권장) — 4건

1. **PrismaClient 인스턴스 중복 생성** — 각 서비스 파일에서 `new PrismaClient()` 호출. 싱글톤 패턴으로 공유 권장 (Phase 2)
2. **notification.service:138 console.log** — SMS 대체용이지만, 프로덕션에서는 로거 라이브러리(winston 등)로 교체 권장
3. **학생 목록 API 페이지네이션 미구현** — MVP 기준 100명 이하이므로 당장은 불필요, Phase 2에서 추가 권장
4. **에러 throw 패턴** — `Object.assign(new Error(), { status })` 대신 커스텀 HttpError 클래스 사용 권장

## API_SPEC.md 준수 검증

| 영역 | 엔드포인트 수 | 구현 | 상태 |
|------|-------------|------|------|
| 인증 | 4 | 4 | 완료 |
| 사용자 | 2 | 2 | 완료 |
| 수업 | 5 | 5 | 완료 |
| 학생 | 5 | 5 | 완료 |
| 수업-학생 | 3 | 3 | 완료 |
| 세션 | 3 | 3 | 완료 |
| 출석 | 3 | 3 | 완료 |
| 알림 | 3 | 3 | 완료 |
| 대시보드 | 1 | 1 | 완료 |
| **합계** | **29** | **29** | **100%** |

## 정보 (참고)

- TypeScript 타입 체크 통과 (에러 0건)
- Routes → Controllers → Services 계층 분리 적절
- Prisma 마이그레이션 + 시드 정상 동작 확인
- 출석 bulk upsert로 트랜잭션 처리됨
