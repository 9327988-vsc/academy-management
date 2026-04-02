# 배포 로그 — v2.1.0 보강 시스템

**배포 대상:** 보강(Makeup) 시스템 Phase 1
**배포 일시:** 2026-04-02
**배포 버전:** v2.1.0

---

## 배포 전 체크리스트

### 코드 준비
- [x] 모든 검수 통과 (FE 심각 0, BE 심각 0, 보안 블로킹 0)
- [x] PHASE_SUMMARY.md 최신 상태
- [x] CHANGELOG.md 업데이트
- [ ] main 브랜치 커밋 및 push

### 환경 변수 (Railway 추가 필요)
```
KAKAO_API_KEY=        (카카오 알림톡 연동 시 설정)
KAKAO_SENDER_KEY=     (카카오 알림톡 연동 시 설정)
```

### DB 마이그레이션
신규 Prisma 모델 4개 추가 — Railway 배포 시 `npm start`의 `prisma migrate deploy`가 자동 실행됨.

**신규 테이블:**
- `makeup_slots` — 보강 가능 시간
- `makeup_requests` — 보강 신청
- `notification_templates` — 알림 템플릿
- `notification_preferences` — 알림 수신 설정

**롤백 마이그레이션 (문제 시):**
```sql
DROP TABLE IF EXISTS notification_preferences;
DROP TABLE IF EXISTS notification_templates;
DROP TABLE IF EXISTS makeup_requests;
DROP TABLE IF EXISTS makeup_slots;
-- enum 타입은 Prisma가 관리하므로 별도 DROP 불필요
```

---

## 배포 순서

### Step 1: 코드 커밋 & Push
```bash
cd /mnt/c/프로젝트/01-학생관리
git add -A
git commit -m "feat: 보강(Makeup) 시스템 v2.1.0 — 슬롯 관리, 신청/승인, 캘린더"
git push origin main
```

### Step 2: Railway 자동 배포
- GitHub push 감지 → 자동 빌드 + 마이그레이션 + 배포
- 로그 확인: Railway 대시보드 → Logs

### Step 3: Vercel 자동 배포
- GitHub push 감지 → 자동 빌드 + 배포
- 새 환경변수 추가 불필요 (기존 VITE_API_URL 유지)

### Step 4: 헬스체크
```bash
# API 헬스체크
curl https://YOUR_RAILWAY_URL/api/health

# 보강 API 동작 확인 (로그인 후 토큰으로)
curl -H "Authorization: Bearer TOKEN" https://YOUR_RAILWAY_URL/api/makeup/slots
```

---

## 헬스체크 항목

- [ ] 메인 페이지 로딩
- [ ] 로그인 동작
- [ ] 대시보드에 보강 섹션 표시
- [ ] 보강 슬롯 생성 (선생님)
- [ ] 보강 슬롯 목록 조회
- [ ] 보강 캘린더 페이지 로딩
- [ ] DB 테이블 생성 확인 (makeup_slots, makeup_requests 등)

---

## 롤백 플랜

### 롤백 기준
- 에러율 1% 이상 급증
- 핵심 기능 (로그인, 대시보드, 출석) 동작 불가
- DB 마이그레이션 실패

### 롤백 절차
```bash
# 1. 이전 커밋으로 롤백
git revert HEAD
git push origin main

# 2. DB 롤백 (필요 시)
# Railway → MySQL → Query 탭에서 위 DROP TABLE 실행
```

---

## 변경 파일 요약

### 신규 파일 (10개)
- `backend/src/services/makeup.service.ts`
- `backend/src/controllers/makeup.controller.ts`
- `backend/src/routes/makeup.routes.ts`
- `frontend/src/api/makeup.api.ts`
- `frontend/src/pages/MakeupSlotManagePage.tsx`
- `frontend/src/pages/MakeupRequestPage.tsx`
- `frontend/src/pages/MakeupCalendarPage.tsx`
- `docs/DESIGN_V2_MAKEUP.md`
- `docs/SCHEMA_V2_MAKEUP.md`
- `docs/BE_REVIEW_V2.md`, `FE_REVIEW_V2.md`, `INTEGRATION_REPORT_V2.md`, `SECURITY_REPORT_V2.md`

### 수정 파일 (주요)
- `backend/prisma/schema.prisma` — 모델 4개, enum 4개 추가
- `backend/src/app.ts` — 라우트 등록
- `backend/src/utils/error.utils.ts` — 보안 수정
- `frontend/src/App.tsx` — 라우트 3개 추가
- `frontend/src/components/layout/Header.tsx` — 네비 추가
- `frontend/src/pages/DashboardPage.tsx` — 보강 섹션
- `frontend/src/pages/student/StudentDashboard.tsx` — 보강 현황
- `frontend/src/pages/parent/ParentDashboard.tsx` — 보강 현황
- `frontend/src/types/index.ts` — Makeup 타입 추가
