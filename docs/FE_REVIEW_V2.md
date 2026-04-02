# FE 검수 결과 -- 보강 시스템 (v2)

**검수일:** 2026-04-02
**검수 대상:** 보강(Makeup) 시스템 FE 구현 전체
**검수 에이전트:** FE Review Agent

---

## 심각 (즉시 수정 필요)

- [DashboardPage.tsx:23] `recentAttendance: any[]` -- TypeScript `any` 타입 사용. 적절한 타입으로 교체함. -> **수정 완료**
- [Header.tsx:54] `icon: any` -- DEV_ROLES 배열의 icon 속성이 `any` 타입. `typeof Settings`으로 교체함. -> **수정 완료**
- [MakeupSlotManagePage.tsx:255] 뒤로가기 버튼(SVG 아이콘 전용)에 `aria-label` 누락. 스크린리더가 목적을 알 수 없음. -> **수정 완료**
- [MakeupSlotManagePage.tsx:315-325] 슬롯 수정/마감/삭제 아이콘 버튼에 `aria-label` 누락. -> **수정 완료**
- [MakeupCalendarPage.tsx:140-145] 이전/다음 달 아이콘 버튼에 `aria-label` 누락. -> **수정 완료**
- [MakeupRequestPage.tsx:227] `<textarea>`에 연결된 `<label>` 없음. 스크린 리더 접근성 위반. `sr-only` label 추가함. -> **수정 완료**

---

## 경고 (수정 권장)

### 기능 누락 (DESIGN_V2_MAKEUP.md 대비)

- [MakeupSlotManagePage.tsx] DESIGN 와이어프레임 3-1에 정의된 "일정변경" 버튼이 승인/거절 옆에 없음. ApprovalActions에 RescheduleButton이 누락됨.
- [MakeupSlotManagePage.tsx] DESIGN 슬롯 추가 모달에 "교실(Room)" 입력 필드가 명세에 있으나 구현에서 누락됨.
- [MakeupRequestPage.tsx] DESIGN 와이어프레임 3-2에 정의된 "결석 수업 선택" (AbsenceSelector) 드롭다운이 구현되지 않음. 현재 학생이 어떤 결석에 대한 보강인지 선택하는 UI가 없음.
- [MakeupRequestPage.tsx:63-64] `studentId: ''`와 `originalAttendanceId: ''`가 빈 문자열로 전달됨. 서버에서 인증 기반으로 결정한다고 주석이 있으나, API 타입 정의(`createRequestApi`)에서 둘 다 required string. 서버 구현과 실제 일치하는지 BE와 확인 필요.
- [DESIGN_V2_MAKEUP.md 섹션 8] 캘린더 키보드 탐색: 방향키로 날짜 이동, Enter로 선택이 명세에 있으나, 현재 `<button>` 요소로 탭 탐색만 가능하고 방향키 네비게이션은 미구현.
- [DESIGN_V2_MAKEUP.md 섹션 8] 거절 시 AlertDialog 확인창 표시가 명세에 있으나, MakeupSlotManagePage와 DashboardPage 모두 거절 버튼이 확인 없이 즉시 API 호출함.
- [AttendancePage] DESIGN에 명시된 MakeupSuggestBanner (결석 학생 발생 시 보강 안내 배너)가 구현되지 않음.
- [NotificationSettingsPage] DESIGN에 명시된 `/settings/notifications` 알림 채널 설정 페이지가 구현되지 않음 (이번 scope 밖일 수 있음).

### 코드 품질

- [MakeupSlotManagePage.tsx:104] `useEffect(() => { fetchData(); }, [classId])` -- `fetchData`가 deps에 없어 React exhaustive-deps 린트 경고 발생. `useCallback`으로 감싸거나 useEffect 내부에 인라인으로 정의 권장.
- [MakeupCalendarPage.tsx:78] 동일 패턴. `useEffect(() => { fetchData(); }, [year, month])` -- `fetchData` 누락.
- [MakeupRequestPage.tsx:42-57] 비동기 호출 패턴이 다른 페이지의 `async/await` 패턴과 다름 (`.then().catch().finally()` vs `try/catch`). 프로젝트 내 일관성 부족.
- [StudentDashboard.tsx:55-59, ParentDashboard.tsx:56-60] `getRequestsApi()` 호출 시 `studentId` 파라미터를 전달하지 않음. 서버가 인증 토큰에서 유추하는지 확인 필요. 그렇지 않으면 전체 요청이 반환되어 데이터 노출 가능성 있음.
- [MAKEUP_STATUS_CONFIG 중복] `StudentDashboard.tsx:31-37`과 `ParentDashboard.tsx:32-38`에 완전히 동일한 `MAKEUP_STATUS_CONFIG` 객체가 복사-붙여넣기됨. 공통 상수 파일로 추출 권장.
- [formatDate 함수 중복] `MakeupSlotManagePage.tsx:59-63`과 `MakeupRequestPage.tsx:25-29`에 동일한 `formatDate` 유틸이 중복 정의됨. 공통 유틸로 추출 권장.

### 상태 관리

- [MakeupSlotManagePage.tsx] 프로젝트에 TanStack Query가 설정되어 있으나(`App.tsx` QueryClientProvider), 보강 관련 모든 페이지가 `useEffect` + `useState`로 수동 상태 관리 중. 기존 패턴 확인 필요하나, 이미 QueryClient가 있는데 활용하지 않음은 mutation 후 캐시 무효화(invalidation) 이점을 잃는 것.
- [DashboardPage.tsx:87] `setPendingRequests((prev) => prev.filter(...))` -- 승인/거절 후 로컬 상태만 업데이트. 다른 페이지(MakeupSlotManagePage, MakeupCalendarPage)에서는 `fetchData()`로 전체 리페치함. 전략이 혼재됨.

### 성능

- [MakeupCalendarPage.tsx:93-98] `slotsByDate` 그룹핑이 매 렌더마다 재계산됨. `useMemo`로 감싸면 불필요한 연산 방지 가능.

---

## 정보 (참고)

- 보강 상태 뱃지 색상은 DESIGN_V2_MAKEUP.md 명세와 정확히 일치함 (PENDING=yellow, APPROVED=blue, COMPLETED=green, REJECTED=red, CANCELLED=slate).
- 슬롯 상태 뱃지는 AVAILABLE=green, FULL=yellow, CLOSED=slate로 직관적이나 DESIGN 문서에 슬롯 상태 색상 명세가 별도로 없어 구현자 판단으로 보임.
- `MakeupRequestPage`의 성공 화면에서 "대시보드로 이동" 링크가 `/student/dashboard`로 하드코딩됨. PARENT 역할이 이 페이지에 접근할 수 있으므로(App.tsx:59), 학부모인 경우 `/parent/dashboard`로 이동해야 함.
- `MakeupCalendarPage`는 현재 선생님 전용(TEACHER/ADMIN)이지만, 학생/학부모도 캘린더로 보강 일정을 확인할 수 있으면 UX 개선 가능.
- 전체적으로 Loading/Error/Empty/Success 상태 처리가 잘 되어 있고, 한국어 에러 메시지가 적절함.
- `MakeupSlotManagePage`에서 슬롯 삭제 시 확인 대화상자 없이 즉시 삭제됨. 실수 방지를 위해 확인 절차 추가 권장.
