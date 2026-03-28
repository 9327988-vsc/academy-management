# INTEGRATION_REPORT.md — 통합 테스트 보고서

**테스트일:** 2026-03-28
**담당:** Integration Agent

---

## FE ↔ BE 연동 지점 (17개)

| # | FE 페이지 | 호출 API | 기댓값 | 결과 |
|---|-----------|---------|--------|------|
| 1 | SignupPage | POST /auth/register | 201 + 성공 메시지 | PASS |
| 2 | LoginPage | POST /auth/login | accessToken + user | PASS |
| 3 | Layout | GET /users/me | 사용자 정보 | PASS |
| 4 | DashboardPage | GET /dashboard/stats | 통계 데이터 | PASS |
| 5 | ClassListPage | GET /classes | 수업 목록 | PASS |
| 6 | ClassDetailPage | GET /classes/:id | 수업 상세 + 학생 | PASS |
| 7 | StudentManagePage | GET /classes/:id/students | 학생 목록 + 학부모 | PASS |
| 8 | AttendancePage | POST /sessions | 세션 생성 | PASS |
| 9 | AttendancePage | POST /attendance/bulk | 출석 일괄 등록 | PASS |
| 10 | NotificationPage | GET /sessions/:id/attendance | 출석 현황 + 통계 | PASS |
| 11 | NotificationPage | POST /sessions/:id/preview-notification | 알림 미리보기 | PASS |
| 12 | NotificationPage | POST /sessions/:id/send-notification | 알림 발송 (6건) | PASS |
| 13 | - | GET /notifications | 알림 내역 조회 | PASS |
| 14 | - | 인증 없이 API 호출 | 401 에러 응답 | PASS |
| 15 | - | 잘못된 입력으로 회원가입 | 400 + 검증 에러 | PASS |
| 16 | client.ts | POST /auth/refresh | 새 accessToken | PASS |
| 17 | - | CORS preflight 요청 | origin 허용 | PASS |

## 환경 변수 확인

| 항목 | FE | BE | 일치 |
|------|----|----|------|
| API URL | http://localhost:4000/api | PORT=4000 | O |
| CORS | localhost:5173 (Vite) | CORS_ORIGIN=localhost:5173 | O |
| 인증 방식 | Authorization: Bearer | authenticate middleware | O |
| Content-Type | application/json | express.json() | O |

## 불일치 사항

**발견된 불일치: 0건**

모든 FE API 호출 함수의 엔드포인트, 요청 형식, 응답 파싱이 BE와 정확히 일치합니다.

## E2E 흐름 검증

```
회원가입 → 로그인 → 토큰 획득
  → 대시보드 조회 (수업 2개, 학생 5명)
  → 수업 목록 조회 (수학반 3명, 영어반 2명)
  → 수업 상세 조회 (학생 + 학부모 정보)
  → 세션 생성 (출석 체크 + 진도 입력)
  → 출석 일괄 등록 (출석 2명, 결석 1명)
  → 알림 미리보기 (출석/결석 분류, 6명 수신자)
  → 알림 발송 (6건 성공, 0건 실패)
  → 알림 내역 확인 (6건 조회)
```

## 결론

- **연동 지점 17/17 통과 (100%)**
- **불일치 사항 0건**
- **통합 테스트 PASS**
