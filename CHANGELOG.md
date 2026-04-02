# Changelog

## [2.1.0] - 2026-04-02 — 보강(Makeup) 시스템

### Added (신규 기능)

**Backend**
- 보강 슬롯 관리 API (CRUD 5개 엔드포인트)
- 보강 신청/승인/거절 API (4개 엔드포인트)
- Prisma 스키마: MakeupSlot, MakeupRequest, NotificationTemplate, NotificationPreference 모델
- 트랜잭션 기반 정원 관리 (currentCount 동기화)
- 레이스 컨디션 방지 (TOCTOU 트랜잭션 래핑)
- 시간 충돌 감지 (슬롯 생성/수정 시)
- Role-based 데이터 격리 (TEACHER→본인 슬롯, STUDENT→본인 신청, PARENT→자녀)
- Kakao API 환경변수 플레이스홀더

**Frontend**
- 보강 슬롯 관리 페이지 (`/classes/:id/makeup`) — 선생님용
- 보강 신청 페이지 (`/makeup/request/:classId`) — 학생/학부모용
- 보강 캘린더 페이지 (`/makeup/calendar`) — 월간 뷰
- 선생님 대시보드에 보강 대기 섹션
- 학생 대시보드에 보강 현황 섹션
- 학부모 대시보드에 자녀 보강 현황 섹션
- Header에 "보강관리" 네비게이션 항목
- MakeupSlot/MakeupRequest TypeScript 타입

### Fixed (수정)
- PrismaClient 중복 인스턴스 → 싱글톤 패턴 적용
- error.utils.ts Prisma 에러 메시지 클라이언트 노출 → 제네릭 메시지
- DashboardPage `any[]` 타입 → 구체 타입
- Header `icon: any` → 정확한 타입
- 아이콘 버튼 aria-label 누락 → 접근성 개선
- FE 타입과 BE 응답 구조 불일치 (flat → nested) → 통합 수정

### Security
- 보안 39개 항목 검사 통과 (블로킹 0건)
- authorize 미들웨어 누락 수정
- getAvailableSlots 데이터 격리 강화
- 슬롯 수정 시 시간 충돌 체크 추가
- startTime >= endTime 검증 추가

---

## [2.0.0] - 2026-03-28 — MVP 완성

### Added
- 선생님 회원가입/로그인 (JWT)
- 수업 CRUD + 학생 관리 + 출석 체크
- 수업 종료 처리 + SMS 알림 발송
- 관리자/학부모/학생 포털
- 결제, 상담, 성적, 급여 관리 스키마
