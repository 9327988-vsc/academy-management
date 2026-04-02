# 통합 검증 보고서 -- 보강 시스템 (v2)

## FE <-> BE 연동 지점

| # | FE 컴포넌트 | 호출 API | Method | BE 라우트 | 결과 | 비고 |
|---|------------|---------|--------|-----------|------|------|
| 1 | MakeupSlotManagePage | `/makeup/slots` | POST | `/slots` (POST) | PASS | classId, slotDate, startTime, endTime, maxStudents 일치 |
| 2 | MakeupSlotManagePage | `/makeup/slots?startDate&endDate&classId` | GET | `/slots` (GET) | PASS (수정 후) | startDate/endDate 필수 누락 -> 수정 완료 |
| 3 | MakeupSlotManagePage | `/makeup/slots/:id` | PATCH | `/slots/:id` (PATCH) | PASS | slotDate, startTime, endTime, maxStudents, status 일치 |
| 4 | MakeupSlotManagePage | `/makeup/slots/:id` | DELETE | `/slots/:id` (DELETE) | PASS | |
| 5 | MakeupSlotManagePage | `/makeup/requests/pending?classId` | GET | `/requests/pending` (GET) | PASS | 응답 shape 일치 (PendingRequest 인터페이스) |
| 6 | MakeupSlotManagePage | `/makeup/requests/:id` | PATCH | `/requests/:id` (PATCH) | PASS | action: APPROVE/REJECT 일치 |
| 7 | MakeupRequestPage | `/makeup/slots/available?studentId&classId` | GET | `/slots/available` (GET) | PASS (수정 후) | studentId 쿼리 파라미터 추가 |
| 8 | MakeupRequestPage | `/makeup/requests` | POST | `/requests` (POST) | PASS (수정 후) | studentId/originalAttendanceId 빈 문자열 -> searchParams에서 읽도록 수정 |
| 9 | MakeupCalendarPage | `/makeup/slots?startDate&endDate` | GET | `/slots` (GET) | PASS | startDate/endDate 정상 전달 |
| 10 | MakeupCalendarPage | `/makeup/requests/pending` | GET | `/requests/pending` (GET) | PASS | |
| 11 | DashboardPage | `/makeup/requests/pending?limit=5` | GET | `/requests/pending` (GET) | PASS | PendingMakeupRequest shape가 BE 응답과 일치 |
| 12 | DashboardPage | `/makeup/requests/:id` | PATCH | `/requests/:id` (PATCH) | PASS | action: APPROVE/REJECT 일치 |
| 13 | StudentDashboard | `/makeup/requests` | GET | `/requests` (GET) | PASS (수정 후) | MakeupRequest 타입을 BE 응답 shape에 맞게 수정 |
| 14 | ParentDashboard | `/makeup/requests` | GET | `/requests` (GET) | PASS (수정 후) | MakeupRequest 타입을 BE 응답 shape에 맞게 수정 |

## 환경 설정

- [x] API Base URL 일치 -- FE: `VITE_API_URL || http://localhost:4000/api`, BE: `/api/makeup` 라우트 마운트 (app.ts line 68)
- [x] CORS 설정 적절 -- BE: `cors({ origin: CORS_ORIGIN || 'http://localhost:5173', credentials: true })`
- [x] 인증 토큰 전달 방식 일치 -- FE: `Bearer ${token}` (client.ts interceptor), BE: `authenticate` 미들웨어
- [x] Rate Limiting 설정 -- 전역 100req/min, 인증 10req/min 적용

## 불일치 사항 및 수정 내역

### 이슈 1: MakeupSlotManagePage에서 getSlotsApi 호출 시 필수 파라미터 누락 (CRITICAL)
- **파일**: `frontend/src/pages/MakeupSlotManagePage.tsx`
- **문제**: `getSlotsApi({ classId })`로 호출하지만 BE는 `startDate`와 `endDate`가 필수 (isISO8601 검증)
- **영향**: 400 Bad Request 발생, 슬롯 목록 로드 실패
- **해결**: 현재 날짜부터 90일 후까지의 기본 날짜 범위 추가

### 이슈 2: MakeupRequest FE 타입이 BE 응답 구조와 불일치 (CRITICAL)
- **파일**: `frontend/src/types/index.ts`
- **문제**: FE 타입은 `originalSessionDate`, `originalClassName`, `slotId`, `slot?: MakeupSlot`(flat 구조)를 기대하지만, BE `getRequests`는 `originalAttendance: { id, date, className, status }`, `slot: { id, slotDate, startTime, endTime, teacherName }`(nested 구조) 반환
- **영향**: StudentDashboard, ParentDashboard에서 `req.originalClassName`, `req.originalSessionDate` 접근 시 undefined
- **해결**: 
  - `MakeupRequest` 타입을 BE 응답 구조에 맞게 수정 (nested `originalAttendance`, `slot` 객체)
  - `StudentDashboard.tsx`: `req.originalClassName` -> `req.originalAttendance?.className`, `req.originalSessionDate` -> `req.originalAttendance?.date`
  - `ParentDashboard.tsx`: 동일 수정

### 이슈 3: MakeupRequestPage에서 studentId, originalAttendanceId 빈 문자열 전송 (CRITICAL)
- **파일**: `frontend/src/pages/MakeupRequestPage.tsx`
- **문제**: `createRequestApi({ studentId: '', originalAttendanceId: '', ... })`로 빈 문자열 전송. BE에서 `parseInt('')`은 `NaN`이 됨
- **영향**: 보강 신청 시 DB 오류 또는 검증 실패
- **해결**: URL searchParams에서 `studentId`와 `attendanceId`를 읽도록 수정. 누락 시 에러 메시지 표시. 또한 가용 슬롯 조회 시 `studentId` 파라미터 전달 추가

### 이슈 4: MakeupSlot 타입에 teacherName 필드 누락 (MINOR)
- **파일**: `frontend/src/types/index.ts`
- **문제**: BE `getSlots`는 `teacherName`을 반환하지만 FE `MakeupSlot` 인터페이스에 해당 필드 없음
- **해결**: `teacherName?: string` 필드 추가

## E2E 시나리오 검증

### Flow 1: 보강 슬롯 생성 -- PASS
1. FE `MakeupSlotManagePage` -> 폼에서 slotDate, startTime, endTime, maxStudents 입력
2. `createSlotApi({ classId, slotDate, startTime, endTime, maxStudents })` 호출
3. BE `POST /api/makeup/slots` -> `authenticate` -> `authorize('TEACHER', 'ADMIN')` -> validation -> `createSlot`
4. Controller: userId에서 teacherId 조회 -> Service: 시간 검증 + 충돌 검사 -> DB create
5. 응답: `{ success: true, data: slot }` -> FE `res.success` 체크 후 목록 새로고침
6. **URL/Method/Body/Response 모두 일치**

### Flow 2: 보강 신청 -- PASS (수정 후)
1. FE `MakeupRequestPage` -> 가용 슬롯 조회 `GET /makeup/slots/available?studentId=X&classId=Y`
2. BE: 학생 수강 수업 기반 강사 슬롯 필터링 -> 응답: `{ slots: [{ id, teacherName, slotDate, ... remainingSpots }] }`
3. FE: 슬롯 선택 -> `createRequestApi({ studentId, originalAttendanceId, slotId, studentNote })`
4. BE `POST /api/makeup/requests`: 학생 권한 확인 -> 출석 기록 검증 (ABSENT/EXCUSED만) -> 중복 검사 -> 슬롯 용량 확인 -> DB create (트랜잭션)
5. 응답: `{ success: true, data: { id, studentName, slotDate, slotTime, status } }`
6. **studentId/attendanceId가 searchParams에서 전달되도록 수정 완료**

### Flow 3: 보강 승인 -- PASS
1. FE `MakeupSlotManagePage` 또는 `DashboardPage` -> 승인 버튼 클릭
2. `updateRequestStatusApi(requestId, { action: 'APPROVE' })` -> `PATCH /api/makeup/requests/:id`
3. BE: 권한 확인 (TEACHER 본인 슬롯 또는 ADMIN) -> 상태 전이 규칙 검증 (PENDING -> APPROVED)
4. 트랜잭션: 상태 변경 + `approvedAt` 설정 + slot `currentCount` increment + FULL 자동 전환
5. 응답: `{ success: true, data: { id, status, teacherNote, approvedAt } }`
6. FE: 목록 새로고침 (MakeupSlotManagePage) 또는 목록에서 제거 (DashboardPage)
7. **action, teacherNote 필드 일치**

### Flow 4: 대시보드 보강 표시 -- PASS (수정 후)

#### 강사 대시보드 (DashboardPage)
1. `getPendingRequestsApi({ limit: 5 })` -> `GET /api/makeup/requests/pending?limit=5`
2. BE: teacherId 기준 PENDING 필터 -> 응답: `{ requests: [{ id, studentName, originalDate, originalClassName, requestedSlot: { ... } }] }`
3. FE `PendingMakeupRequest` 인터페이스와 BE 응답 shape 일치 확인 완료

#### 학생 대시보드 (StudentDashboard)
1. `getRequestsApi()` -> `GET /api/makeup/requests`
2. BE: STUDENT role일 때 본인 studentId 자동 필터링
3. 응답: `{ requests: [{ id, studentId, studentName, originalAttendance: { className, date }, slot: { slotDate, startTime, endTime }, status, ... }] }`
4. FE: `req.originalAttendance?.className`, `req.slot.slotDate` 접근 -- **타입 수정으로 일치**

#### 학부모 대시보드 (ParentDashboard)
1. `getRequestsApi()` -> `GET /api/makeup/requests`
2. BE: PARENT role일 때 자녀 studentId 목록으로 자동 필터링
3. 응답 shape: 학생 대시보드와 동일
4. FE: `req.studentName`, `req.originalAttendance?.className` 접근 -- **타입 수정으로 일치**

## 결론

- 연동 지점 통과: **14/14** (수정 후)
- 불일치 사항: **4건 발견, 4건 수정**
  - CRITICAL 3건: 필수 파라미터 누락(1), 타입/응답 구조 불일치(1), 빈 문자열 전송(1)
  - MINOR 1건: 타입 필드 누락(1)

## 수정된 파일 목록

| 파일 | 수정 내용 |
|------|-----------|
| `frontend/src/types/index.ts` | MakeupRequest 타입을 BE 응답 nested 구조로 변경, MakeupSlot에 teacherName 추가 |
| `frontend/src/pages/MakeupSlotManagePage.tsx` | getSlotsApi 호출에 startDate/endDate 기본값 추가 |
| `frontend/src/pages/MakeupRequestPage.tsx` | searchParams에서 studentId/attendanceId 읽기, 가용슬롯 조회에 studentId 전달 |
| `frontend/src/pages/student/StudentDashboard.tsx` | originalClassName -> originalAttendance?.className, originalSessionDate -> originalAttendance?.date |
| `frontend/src/pages/parent/ParentDashboard.tsx` | 동일 수정 |

## 잔여 주의사항

1. **MakeupRequestPage 진입 경로**: `/makeup/request/:classId?studentId=X&attendanceId=Y` 형태로 링크해야 함. 이 링크를 생성하는 페이지(학생 대시보드 등)에서 올바른 searchParams를 전달하는지 확인 필요
2. **ID 타입 불일치**: FE는 모든 ID를 `string`으로, BE는 `number`로 처리. axios가 JSON 직렬화/역직렬화를 자동으로 하므로 응답 데이터는 `number`로 올 수 있음. `===` 비교 시 주의 필요
3. **BE `classId` 검증**: BE routes에서 `body('classId').optional().isInt()` 사용하지만, FE `createSlotApi`는 `classId`를 `string`으로 전송. BE가 문자열 "5"를 `isInt()`로 검증 가능 (express-validator는 문자열 정수도 통과)
