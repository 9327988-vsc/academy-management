# BE 검수 결과 -- 보강 시스템 (v2)

**검수 일시:** 2026-04-02
**검수 대상:** makeup.service.ts, makeup.controller.ts, makeup.routes.ts, schema.prisma (신규 모델)
**검수 에이전트:** BE Review Agent

---

## 심각 (즉시 수정 필요)

### S-1. PrismaClient 중복 인스턴스 생성
- **[makeup.service.ts:1]** `new PrismaClient()`를 직접 생성하여 `utils/prisma.ts`의 싱글턴을 사용하지 않음. 커넥션 풀이 분산되어 DB 커넥션 고갈 가능.
  - **수정 완료**: `import prisma from '../utils/prisma'`로 변경

- **[makeup.controller.ts:5]** 동일 문제. 컨트롤러에서도 `new PrismaClient()` 직접 생성.
  - **수정 완료**: `import prisma from '../utils/prisma'`로 변경

### S-2. createRequest 레이스 컨디션 (동시 신청 시 슬롯 초과 가능)
- **[makeup.service.ts:284-369]** 중복 검사, 슬롯 가용성 검사, 신청 생성이 트랜잭션 밖에서 개별적으로 수행됨. 두 클라이언트가 동시에 마지막 자리를 확인하면 둘 다 통과할 수 있음.
  - **수정 완료**: 중복 검사 + 슬롯 검증 + 생성을 `prisma.$transaction` 내부로 이동

### S-3. updateRequestStatus TOCTOU 취약점
- **[makeup.service.ts:560-677]** 트랜잭션 밖에서 조회한 `request.status`를 기준으로 상태 전이를 판단하지만, 트랜잭션 내에서 최신 상태를 재확인하지 않음. 동시 요청 시 이미 APPROVED된 건을 다시 APPROVE하여 currentCount가 이중 증가할 수 있음.
  - **수정 완료**: 트랜잭션 내에서 `freshRequest`를 다시 조회하여 최신 상태 기준으로 전이 검증. APPROVE 시 슬롯 FULL 여부도 트랜잭션 내에서 재검증.

### S-4. updateSlot 시간 변경 시 충돌 검사 누락
- **[makeup.service.ts:204-244]** `createSlot`에는 시간 충돌 검사가 있지만, `updateSlot`에서 날짜/시간 변경 시 충돌 검사가 없어 겹치는 슬롯 생성 가능.
  - **수정 완료**: `updateSlot`에도 동일한 충돌 검사 로직 추가 (자기 자신 제외)

### S-5. startTime >= endTime 허용
- **[makeup.service.ts:createSlot]** startTime이 endTime보다 같거나 큰 경우에도 슬롯이 생성됨. 스펙에서 "startTime보다 이후" 조건 명시.
  - **수정 완료**: `createSlot` 진입 시 `data.startTime >= data.endTime` 검증 추가

---

## 보안 경고

### SEC-1. PATCH /requests/:id에 authorize 미들웨어 누락
- **[makeup.routes.ts:165-179]** 해당 엔드포인트에 `authorize()` 미들웨어가 없음. `authenticate`만 적용되어 인증된 모든 사용자가 라우트에 접근 가능. 서비스 레이어에서 권한 검증을 하지만, 방어적 계층이 빠져 있음.
  - **수정 완료**: `authorize('TEACHER', 'ADMIN', 'STUDENT', 'PARENT')` 추가

### SEC-2. getAvailableSlots에서 NaN studentId 전달
- **[makeup.controller.ts:93-96]** TEACHER/ADMIN 역할이 studentId 없이 호출하면 `parseInt(undefined)` = `NaN`이 서비스로 전달됨. Prisma에서 NaN은 예측 불가한 동작을 유발할 수 있음.
  - **수정 완료**: studentId 미제공 시 400 에러 반환, parseInt 결과 NaN 검증 추가

### SEC-3. getAvailableSlots OR 필터로 미수강 수업 슬롯 노출 가능
- **[makeup.service.ts:171-174]** `filters.classId`가 학생이 수강하지 않는 수업 ID여도 OR 조건에 포함되어 해당 수업 슬롯이 노출됨.
  - **수정 완료**: classId 필터 적용 시 수강 중인 classIds에 포함된 경우만 허용

---

## 경고 (수정 권장)

### W-1. handleError 응답 키 불일치
- **[error.utils.ts:18]** `handleError`는 응답에 `error` 키를 사용하지만, 컨트롤러의 직접 응답은 `message` 키를 사용. API 클라이언트가 에러 메시지를 파싱할 때 일관성 문제 발생.
  - `res.status(error.statusCode).json({ success: false, error: error.message })` vs `res.status(404).json({ success: false, message: '...' })`

### W-2. updateSlot에서 maxStudents를 currentCount 이하로 줄일 수 있음
- **[makeup.service.ts:237]** `maxStudents`를 변경할 때 현재 `currentCount`보다 작은 값이 허용됨. 이미 3명이 승인된 상태에서 maxStudents=2로 변경하면 데이터 정합성이 깨짐.
  - **수정 완료**: `maxStudents < slot.currentCount` 검증 추가

### W-3. getAvailableSlots에 페이지네이션 없음
- **[makeup.service.ts:144-208]** `getAvailableSlots`는 페이지네이션 없이 전체 결과를 반환. 슬롯이 많아지면 응답 크기가 비정상적으로 커질 수 있음.

### W-4. 슬롯 생성 시 과거 날짜 검증 누락
- **[makeup.service.ts:11-67]** 스펙(7-3)에서 "과거 날짜 불가"를 명시하지만, `createSlot`에서 `slotDate`가 오늘 이전인지 검증하지 않음.

### W-5. classId=0이 null로 변환됨
- **[makeup.service.ts:58]** `data.classId || null` 표현은 classId가 0일 때도 null이 됨. `classId ?? null`이 올바름.

### W-6. `any` 타입 잔존
- **[makeup.service.ts:88,449]** `status: filters.status as any` 등 `as any` 캐스팅이 여러 곳에 남아 있음. 타입 안전성 저하.

### W-7. Notification 테이블 확장 미완료
- **[schema.prisma]** 스펙(SCHEMA_V2_MAKEUP.md 3-1)에서 Notification 테이블에 `channel`, `templateId`, `scheduledAt` 필드 추가를 명시. NotificationTemplate의 `notifications Notification[]` 관계도 누락. 스키마에 해당 변경이 반영되지 않음.

### W-8. createRequest에서 수강 등록 검증 누락
- **[makeup.service.ts:320-408]** 스펙(7-5 항목 2)에서 "해당 학생이 원본 수업에 수강 등록되어 있는지 확인"을 명시하지만, 출석 기록의 studentId만 확인할 뿐 실제 Enrollment 존재 여부는 검증하지 않음.

---

## 정보 (참고)

### I-1. 알림 관련 5개 API 미구현
- 스펙에서 정의한 알림 설정/템플릿 API 5개(GET/PATCH preferences, GET/POST/PATCH templates)가 아직 구현되지 않음. 별도 태스크로 처리 필요.

### I-2. 스펙에서 요구하는 세분화된 Rate Limiting 미적용
- 스펙(7-4)에서 엔드포인트별 Rate Limiting(POST /requests 10회/분, POST /templates 5회/분 등)을 요구하지만, 현재는 전역 `/api` Rate Limiter(100회/분)만 적용되어 있음.

### I-3. deleteSlot 트랜잭션에서 batched 트랜잭션 사용
- **[makeup.service.ts:306-312]** `prisma.$transaction([...])` 배열 형태는 interactive 트랜잭션과 달리 각 쿼리 사이에 다른 작업이 끼어들 수 있음. PENDING 신청이 삭제 직전에 APPROVE될 수 있으나, 위험도는 낮음.

### I-4. isRecurring=true 시 recurringDay 필수 검증 부재
- 라우트에서 `recurringDay`는 optional로 되어 있어, `isRecurring=true`인데 `recurringDay`가 없는 슬롯이 생성될 수 있음. 비즈니스 규칙 위반이지만 현재 자동 생성 기능이 없으므로 당장 문제되지는 않음.

---

## 수정 파일 요약

| 파일 | 수정 내용 |
|------|----------|
| `backend/src/services/makeup.service.ts` | S-1(PrismaClient), S-2(createRequest 트랜잭션), S-3(updateRequestStatus TOCTOU), S-4(updateSlot 충돌검사), S-5(startTime 검증), SEC-3(OR 필터), W-2(maxStudents 검증) |
| `backend/src/controllers/makeup.controller.ts` | S-1(PrismaClient), SEC-2(NaN 방어) |
| `backend/src/routes/makeup.routes.ts` | SEC-1(authorize 추가) |
