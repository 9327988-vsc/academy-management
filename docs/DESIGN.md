# DESIGN.md — UI 디자인 시스템

**프로젝트:** Academy Smart Management System (ASMS)
**작성일:** 2026-03-28
**단계:** Phase 3 디자인 (FE)
**담당:** UI Design Agent

---

## 1. 페이지 구조

| # | 경로 | 페이지명 | 인증 | 설명 |
|---|------|---------|------|------|
| 1 | `/login` | LoginPage | X | 이메일/비밀번호 로그인 |
| 2 | `/signup` | SignupPage | X | 선생님 회원가입 |
| 3 | `/dashboard` | DashboardPage | O | 오늘 수업, 통계 요약 |
| 4 | `/classes` | ClassListPage | O | 내 수업 목록 |
| 5 | `/classes/:id` | ClassDetailPage | O | 수업 상세 + 학생/세션 탭 |
| 6 | `/classes/:id/students` | StudentManagePage | O | 수업별 학생 관리 |
| 7 | `/classes/:id/attendance` | AttendancePage | O | 출석 체크 + 수업 종료 |
| 8 | `/classes/:id/sessions/:sid/notify` | NotificationPage | O | 알림 미리보기 + 발송 |

### 라우팅 구조

```
App
├── / → redirect to /dashboard (인증 시) or /login
├── /login (공개)
├── /signup (공개)
└── ProtectedRoute (인증 필요)
    ├── Layout (Header + Content)
    │   ├── /dashboard
    │   ├── /classes
    │   ├── /classes/:id
    │   ├── /classes/:id/students
    │   ├── /classes/:id/attendance
    │   └── /classes/:id/sessions/:sid/notify
```

---

## 2. 컴포넌트 계층 (트리)

```
App
├── AuthProvider (Zustand authStore)
├── QueryClientProvider (TanStack Query)
│
├── [공개 라우트]
│   ├── LoginPage
│   │   └── LoginForm (email, password, submit)
│   └── SignupPage
│       └── SignupForm (name, email, phone, password, confirm)
│
└── ProtectedRoute
    └── Layout
        ├── Header
        │   ├── Logo + 앱 이름
        │   ├── Navigation (대시보드, 수업관리)
        │   └── UserMenu (이름, 로그아웃)
        │
        └── Content (Outlet)
            ├── DashboardPage
            │   ├── StatCards (오늘 수업 수, 전체 학생 수, 전체 수업 수)
            │   ├── TodayClassList
            │   │   └── TodayClassCard (수업명, 시간, 학생 수, [출석체크] 버튼)
            │   └── RecentSessionList
            │       └── RecentSessionItem (수업명, 날짜, 알림 상태)
            │
            ├── ClassListPage
            │   ├── PageHeader ("내 수업 관리" + [새 수업 만들기] 버튼)
            │   ├── ClassGrid
            │   │   └── ClassCard (수업명, 과목, 요일/시간, 학생 수, 액션 버튼)
            │   ├── ClassCreateModal
            │   │   └── ClassForm (수업명, 과목, 요일 체크박스, 시간, 교실, 정원)
            │   └── ClassEditModal
            │       └── ClassForm (동일, 수정 모드)
            │
            ├── ClassDetailPage
            │   ├── ClassHeader (수업 정보 요약 + [수정] [삭제])
            │   ├── TabNavigation (학생 | 수업 기록)
            │   ├── [학생 탭] → StudentManagePage (인라인)
            │   └── [수업 기록 탭] → SessionListPage (인라인)
            │
            ├── StudentManagePage
            │   ├── PageHeader (수업명 + [학생 추가] 버튼)
            │   ├── StudentList
            │   │   └── StudentCard
            │   │       ├── 학생 정보 (이름, 학년, 학교, 전화번호)
            │   │       ├── ParentInfo (이름, 관계, 전화번호)
            │   │       └── Actions ([수정] [삭제])
            │   ├── StudentCreateModal
            │   │   └── StudentForm (학생 정보 + 학부모 정보)
            │   └── StudentEditModal
            │       └── StudentForm (수정 모드)
            │
            ├── AttendancePage
            │   ├── SessionInfoBar (수업명, 날짜, 시간)
            │   ├── AttendanceControls ([전체 출석] [전체 결석])
            │   ├── AttendanceList
            │   │   └── AttendanceRow
            │   │       ├── 학생 이름
            │   │       └── StatusButtons (출석/결석/지각 — 토글)
            │   ├── SessionCompleteForm (진도, 숙제, 다음 수업 입력)
            │   └── SubmitBar ([취소] [알림 미리보기])
            │
            └── NotificationPage
                ├── NotificationPreview
                │   ├── PresentStudentMessages (출석 학생 알림 목록)
                │   └── AbsentStudentMessages (결석 학생 알림 목록)
                ├── SendSummary (총 발송 건수, 대상)
                ├── SendButton ([알림 발송하기])
                └── SendResult (발송 완료 결과 표시)
```

---

## 3. 디자인 시스템 (토큰)

### 색상 팔레트 (3색 + 시맨틱)

```
주색상 (Primary):     #2563EB (Blue 600)  — 버튼, 링크, 활성 상태
보조색상 (Secondary): #475569 (Slate 600) — 보조 텍스트, 비활성
배경색 (Background):  #F8FAFC (Slate 50)  — 전체 배경
카드 배경:            #FFFFFF (White)      — 카드, 모달
텍스트:               #0F172A (Slate 900)  — 본문
보조 텍스트:          #64748B (Slate 500)  — 설명, 라벨
```

### 시맨틱 색상

```
성공 (Success):  #16A34A (Green 600)  — 출석, 발송 성공
경고 (Warning):  #CA8A04 (Yellow 600) — 지각
위험 (Danger):   #DC2626 (Red 600)    — 결석, 에러, 삭제
정보 (Info):     #2563EB (Blue 600)   — 알림, 안내
```

### 타이포그래피

```
폰트 패밀리: Pretendard (한글) + Inter (영문) — Tailwind 기본 sans로 대체 가능
제목 (h1):   text-2xl font-bold   (24px)
제목 (h2):   text-xl font-semibold (20px)
제목 (h3):   text-lg font-medium   (18px)
본문:        text-sm               (14px)
캡션:        text-xs text-slate-500 (12px)
```

### 간격 (Spacing)

```
기본 단위: 4px (Tailwind 기본)
컴포넌트 내부 패딩: p-4 (16px)
카드 간 간격: gap-4 (16px)
섹션 간 간격: space-y-6 (24px)
페이지 패딩: px-6 py-6 (24px)
```

### 컴포넌트 스타일

```
카드:    rounded-lg border border-slate-200 bg-white
버튼:    rounded-md px-4 py-2 font-medium
         Primary: bg-blue-600 text-white hover:bg-blue-700
         Secondary: bg-white border border-slate-300 hover:bg-slate-50
         Danger: bg-red-600 text-white hover:bg-red-700
모달:    rounded-lg bg-white shadow-lg max-w-md
입력:    rounded-md border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500
뱃지:    rounded-full px-2 py-0.5 text-xs font-medium
```

---

## 4. 상태 정의 (각 페이지별)

### 공통 상태 패턴

| 상태 | 표시 | 컴포넌트 |
|------|------|----------|
| Loading | 스켈레톤 UI (shadcn/ui Skeleton) | 각 페이지 |
| Error | 에러 메시지 + 재시도 버튼 | ErrorBoundary |
| Empty | 안내 텍스트 + CTA 버튼 | EmptyState |
| Success | 토스트 알림 (shadcn/ui Toast) | 전역 |

### 페이지별 Empty 상태

| 페이지 | 메시지 | CTA |
|--------|--------|-----|
| DashboardPage | "아직 등록된 수업이 없습니다" | [새 수업 만들기] |
| ClassListPage | "수업을 만들어 시작해보세요" | [새 수업 만들기] |
| StudentManagePage | "아직 등록된 학생이 없습니다" | [학생 추가] |
| AttendancePage | "등록된 학생이 없어 출석 체크를 할 수 없습니다" | [학생 관리로 이동] |

### 출석 상태 시각 표현

```
미체크:  bg-slate-100 text-slate-600   — 기본 상태
출석(✓): bg-green-100 text-green-700   — 초록
결석(✗): bg-red-100 text-red-700       — 빨강
지각(△): bg-yellow-100 text-yellow-700 — 노랑
```

---

## 5. 반응형 설계

### 브레이크포인트

```
mobile:  < 768px   — 1컬럼, 네비게이션 햄버거
tablet:  768-1024px — 2컬럼 그리드
desktop: > 1024px   — 사이드바 + 메인 콘텐츠
```

### 모바일 우선 규칙

- 수업 카드: 모바일 1열 → 태블릿 2열 → 데스크톱 3열
- 출석 체크: 모바일에서 버튼 크기 확대 (터치 영역 44px 이상)
- 모달: 모바일에서 전체 화면 (full-screen bottom sheet)
- 테이블 → 모바일에서 카드 리스트로 전환

---

## 6. AI Slop 방지 체크리스트

- [x] 흰 배경에 무조건 그림자 없음 — 카드는 `border`만 사용, `shadow` 미사용
- [x] 불필요한 애니메이션 없음 — 페이지 전환/모달 열기 시 최소한의 fade만
- [x] 과도한 라운딩 없음 — `rounded-lg`(8px) 최대, `rounded-full`은 뱃지만
- [x] 색상 과다 사용 없음 — Primary Blue + 시맨틱 3색(Green/Yellow/Red)만
- [x] 불필요한 아이콘 남용 없음 — 기능적 의미 있는 곳에만 사용
- [x] 과한 padding/margin 없음 — 4px 단위 일관성 유지

---

## 7. shadcn/ui 사용 컴포넌트 목록

| 컴포넌트 | 용도 |
|----------|------|
| Button | 버튼 (Primary, Secondary, Danger, Ghost) |
| Input | 텍스트 입력 |
| Label | 폼 라벨 |
| Card | 수업/학생 카드 |
| Dialog | 모달 (생성/수정/확인) |
| Select | 드롭다운 (학년, 과목, 시간) |
| Checkbox | 요일 선택 (수업 생성) |
| Badge | 상태 뱃지 (출석/결석/지각) |
| Toast | 알림 토스트 (성공/에러) |
| Skeleton | 로딩 스켈레톤 |
| Tabs | 탭 네비게이션 (수업 상세) |
| Table | 알림 발송 내역 |
| DropdownMenu | 유저 메뉴, 액션 메뉴 |
| AlertDialog | 삭제 확인 다이얼로그 |
| Separator | 섹션 구분선 |
