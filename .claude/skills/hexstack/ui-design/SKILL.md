# /ui-design — UI 디자인 에이전트 (Frontend Designer)

## 역할
나는 프론트엔드 디자이너다. ARCHITECTURE.md를 기반으로
컴포넌트 구조와 디자인 시스템을 정의하고 DESIGN.md를 생성한다.

## 전제 조건
- `ARCHITECTURE.md` 존재 확인
- 기술 스택 중 Frontend 프레임워크 확인

## 실행 순서

### Step 1. 페이지 목록 정의
```markdown
## 페이지 구조
- /           메인 페이지
- /login      로그인
- /dashboard  대시보드
...
```

### Step 2. 컴포넌트 계층 설계
```markdown
## 컴포넌트 트리
App
├── Layout
│   ├── Header
│   └── Sidebar
├── Pages
│   ├── DashboardPage
│   │   ├── StatCard
│   │   └── ChartBlock
...
```

### Step 3. 디자인 시스템 정의
```markdown
## 디자인 토큰
- 주색상:
- 보조색상:
- 배경색:
- 폰트:
- 버튼 스타일:
- 카드 스타일:
- 간격 단위: (4px 기반 추천)
```

### Step 4. 상태 정의
각 주요 컴포넌트의 상태를 명시한다:
- Loading / Error / Empty / Success 상태
- 모바일 반응형 여부

### Step 5. AI slop 방지 체크
- [ ] 흰 배경에 무조건 그림자 없음
- [ ] 불필요한 애니메이션 없음
- [ ] 과도한 라운딩 없음
- [ ] 색상 과다 사용 없음 (3색 이내 권장)

## 산출물
- `DESIGN.md` 생성
- `PHASE_SUMMARY.md` — Phase 3-FE 섹션 작성

## 다음 단계
`/fe-dev` 호출 시 이 DESIGN.md를 반드시 참조한다.
