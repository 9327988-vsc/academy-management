---
name: academy-dev-verify
description: 학원관리시스템 MVP 프로젝트 전용 개발-검증-개선-UI/UX 사이클 스킬. 코드를 작성하거나 수정할 때마다 반드시 이 스킬의 검증 프로세스를 실행한다. 프론트엔드 컴포넌트·페이지를 작성할 때는 Part 4의 UI/UX 에이전트 기준을 반드시 적용한다. 또한 챗 세션이 종료되거나 다른 챗방으로 이동할 때 반드시 브리핑 자료를 생성한다. 트리거: 코드 작성/수정 완료 시, "점검해줘", "검증", "테스트", "오류 확인" 언급 시, 프론트엔드 UI 작업 시, "UI", "UX", "디자인", "화면", "레이아웃", "사용성" 언급 시, 세션 종료/이동 요청 시, "브리핑", "인수인계", "요약" 요청 시. 학원관리시스템 개발 중이라면 항상 이 스킬을 참조하라.
---

# 학원관리시스템 MVP — 개발·검증·개선·UI/UX·브리핑 스킬

## 프로젝트 컨텍스트

- **프로젝트:** 학원 관리 시스템 MVP (React 18 + Vite + Tailwind / Express + Prisma + SQLite)
- **핵심 플로우:** 선생님 인증 → 수업 관리 → 학생 관리 → 출석 체크 → 수업 종료 → SMS 알림
- **PRD 위치:** `/mnt/user-data/uploads/학생관리시스템_.md`

---

## Part 1: 개발-검증-개선 사이클

모든 코드 작성/수정 후 아래 3단계를 반드시 순서대로 수행한다. 한 단계라도 건너뛰지 않는다.

### STEP 1: 개발 (Build)

코드를 작성한다. 작성 시 다음을 지킨다:

- PRD의 API 명세, DB 스키마, 화면 설계를 기준으로 구현
- 하나의 단위(API 엔드포인트 1개, 컴포넌트 1개, 기능 1개)를 완성한 뒤 반드시 STEP 2로 진행
- 여러 파일을 한꺼번에 작성하더라도 기능 단위로 묶어서 검증 사이클을 돈다

**단위 기준 예시:**
- 백엔드: 라우트 1개 + 컨트롤러 + 서비스 로직 (예: POST /api/auth/register)
- 프론트엔드: 페이지 1개 또는 핵심 컴포넌트 1개 (예: Login.jsx)
- DB: 스키마 변경 + 마이그레이션 실행
- 통합: 프론트 ↔ 백엔드 연동 1개 플로우

### STEP 2: 자체 오류 점검 (Verify)

개발 완료 즉시 아래 체크리스트를 **위에서 아래로 순서대로** 실행한다. 각 항목은 실제 명령어를 실행하여 확인하며, "눈으로 보기"만으로 통과시키지 않는다.

#### 2-A. 구문 검사 (Syntax Check)
```bash
# 백엔드 — 문법 오류 확인
cd /home/claude/academy-mvp/backend
node -e "require('./src/index.js')" 2>&1 || echo "❌ SYNTAX ERROR"

# 프론트엔드 — 빌드 가능 여부 확인
cd /home/claude/academy-mvp/frontend
npx vite build --mode development 2>&1 | tail -20
```
통과 기준: 에러 메시지 0건

#### 2-B. 서버 기동 테스트 (Server Boot)
```bash
# 백엔드 서버 기동 (5초 후 자동 종료)
cd /home/claude/academy-mvp/backend
timeout 5 node src/index.js &
SERVER_PID=$!
sleep 3

# 헬스체크
curl -s http://localhost:3000/api/health | head -5
kill $SERVER_PID 2>/dev/null
```
통과 기준: 서버가 크래시 없이 기동되고, 헬스체크 응답이 돌아옴

#### 2-C. API 동작 테스트 (Runtime Verification)
변경한 엔드포인트에 대해 실제 HTTP 요청을 보내고 응답을 확인한다.

```bash
# 예시: 회원가입 API 테스트
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234!","name":"테스트","phone":"010-0000-0000"}' \
  | node -e "process.stdin.on('data',d=>{const r=JSON.parse(d);console.log(r.success?'✅ PASS':'❌ FAIL',JSON.stringify(r,null,2))})"
```

각 API 테스트에서 반드시 확인하는 항목:
1. **HTTP 상태코드**: 기대 값과 일치하는가 (200, 201, 400, 401 등)
2. **응답 구조**: PRD 명세의 Response 형식과 일치하는가
3. **DB 반영**: 데이터가 실제로 저장/수정/삭제되었는가
4. **에러 케이스**: 잘못된 입력 시 적절한 에러 메시지가 오는가

#### 2-D. 데이터 흐름 추적 (Data Flow Trace)
문제가 발생하면 **증상이 아닌 데이터 흐름 전체**를 추적한다:

```
요청(Request) → 라우트(Route) → 미들웨어(Middleware) → 컨트롤러(Controller)
→ 서비스(Service) → Prisma ORM → DB(SQLite) → 응답(Response)
```

각 단계에서 데이터가 어떤 형태로 전달되는지 console.log 또는 직접 확인한다.

#### 2-E. 부작용 검토 (Side Effect Review)
수정한 코드가 다른 기능에 영향을 주는지 확인한다:

- 이 파일을 import하는 다른 파일은 무엇인가?
- 수정한 DB 스키마가 다른 모델의 relation에 영향을 주는가?
- 공통 컴포넌트(Button, Modal 등)를 수정했다면, 사용하는 모든 곳이 정상인가?
- 새로 추가한 환경 변수가 .env에 반영되었는가?

### STEP 3: 개선 (Fix & Improve)

STEP 2에서 발견된 문제를 수정한다. 수정 시 반드시 지키는 원칙:

1. **원인 먼저 특정**: 에러 메시지만 보고 코드를 수정하지 않는다. 데이터 흐름을 추적해서 정확한 원인 위치를 찾은 뒤 수정한다.
2. **부작용 사전 검토**: "이 수정이 다른 곳에 부작용을 일으키는가?" — 수정 전 반드시 자문한다.
3. **마구잡이 수정 금지**: 핵심 원인 1개를 직시하고, 그것만 고친다. 여러 곳을 동시에 수정하면 어디서 문제가 해결되었는지 알 수 없다.
4. **수정 후 재검증**: 수정한 뒤 STEP 2를 다시 돌린다. 통과할 때까지 반복한다.

**수정 루프 제한:**
- 동일 문제에 대해 3회 수정을 시도해도 해결되지 않으면, 접근 방식 자체를 재검토한다.
- "컴파일은 통과하지만 런타임에서 실패"하는 경우, 반드시 실제 실행으로 확인한다.

### 검증 결과 보고 형식

각 단위 검증 완료 후 아래 형식으로 간략히 보고한다:

```
━━━ 검증 결과 ━━━
📦 단위: [작업 내용, 예: POST /api/auth/register]
✅ 구문검사: PASS
✅ 서버기동: PASS
✅ API테스트: PASS (200, 응답구조 일치)
✅ DB반영: PASS (users 테이블에 레코드 생성 확인)
✅ 부작용: 없음
🔄 수정횟수: 0회
━━━━━━━━━━━━━━━━
```

문제가 있었던 경우:
```
━━━ 검증 결과 ━━━
📦 단위: [작업 내용]
✅ 구문검사: PASS
✅ 서버기동: PASS
❌ API테스트: FAIL → 401 Unauthorized
   원인: JWT 시크릿 키가 .env에 누락
   수정: .env에 JWT_SECRET 추가
   재검증: ✅ PASS
✅ DB반영: PASS
✅ 부작용: 없음
🔄 수정횟수: 1회
━━━━━━━━━━━━━━━━
```

---

## Part 2: 세션 종료 브리핑 자료

챗 세션이 종료되거나 다른 챗방으로 이동할 때, **반드시** 아래 브리핑 자료를 생성하여 파일로 저장한다. 이 브리핑은 다음 세션의 Claude가 읽고 즉시 작업을 이어갈 수 있어야 한다.

### 브리핑 생성 트리거

다음 상황에서 자동으로 브리핑을 생성한다:
- 사용자가 "종료", "끝", "다음에", "여기까지", "브리핑" 등을 언급
- 대화가 매우 길어져서 컨텍스트 한계에 근접
- 사용자가 명시적으로 세션 이동을 요청

### 브리핑 파일 형식

파일명: `BRIEFING_[YYYYMMDD]_S[세션번호].md`
저장 위치: `/mnt/user-data/outputs/BRIEFING_[YYYYMMDD]_S[세션번호].md`

### 브리핑 필수 항목 템플릿

```markdown
# 학원관리시스템 MVP — 세션 브리핑
**날짜:** YYYY-MM-DD
**세션:** #N
**진행 Phase:** Week X / 작업명

---

## 1. 완료된 작업
- [x] 작업1: 상세 설명 (파일 경로 포함)
- [x] 작업2: 상세 설명

## 2. 현재 상태
- **백엔드:** 동작 여부, 마지막으로 확인된 상태
- **프론트엔드:** 동작 여부, 마지막으로 확인된 상태
- **DB:** 마이그레이션 상태, 테이블 현황
- **마지막 검증 결과:** PASS/FAIL 및 요약

## 3. 미완료 / 다음에 해야 할 작업
- [ ] 작업1: 상세 설명 + 왜 못했는지
- [ ] 작업2: 상세 설명
- **우선순위:** 다음 세션에서 첫 번째로 할 작업 명시

## 4. 주요 결정사항
- 결정1: 무엇을, 왜 그렇게 결정했는지
- 결정2: ...

## 5. 알려진 이슈 / 주의사항
- 이슈1: 증상 + 원인 추정 + 시도한 해결 방법
- 이슈2: ...

## 6. 파일 변경 목록
| 파일 경로 | 변경 내용 | 상태 |
|-----------|----------|------|
| backend/src/routes/auth.js | 회원가입/로그인 라우트 | ✅ 완료 |
| frontend/src/pages/Login.jsx | 로그인 페이지 | 🚧 진행중 |

## 7. 환경 / 실행 방법
# 백엔드 실행
cd /home/claude/academy-mvp/backend && npm install && npx prisma migrate dev && node src/index.js

# 프론트엔드 실행
cd /home/claude/academy-mvp/frontend && npm install && npm run dev

## 8. 다음 세션 시작 시 첫 번째 할 일
> 구체적으로 "이 파일을 열어서 이것부터 하세요" 수준으로 작성
```

### 브리핑 작성 원칙

1. **다음 Claude가 PRD를 다시 읽지 않아도** 현재 상태를 파악할 수 있어야 한다
2. **파일 경로는 절대경로**로 표기한다
3. **"진행중" 상태의 작업**은 어디까지 했고 어디서 멈췄는지 구체적으로 기술한다
4. **코드 스니펫 금지** — 파일 경로만 참조하고, 코드 자체는 넣지 않는다 (브리핑을 가볍게 유지)
5. **알려진 이슈**는 증상만이 아니라 시도한 해결 방법도 기록한다 (같은 삽질 방지)
6. **실행 방법**은 복붙으로 바로 돌릴 수 있는 명령어로 작성한다

---

## Part 3: 프로젝트별 검증 기준 참고

이 프로젝트의 기술 스택에 맞는 구체적 검증 포인트. 필요할 때 참조한다.

### Prisma / DB 검증
```bash
# 마이그레이션 상태 확인
cd /home/claude/academy-mvp/backend
npx prisma migrate status

# DB 테이블 목록 확인 (SQLite)
npx prisma db execute --stdin <<< "SELECT name FROM sqlite_master WHERE type='table';"

# 특정 테이블 데이터 확인
npx prisma db execute --stdin <<< "SELECT * FROM users LIMIT 5;"
```

### Express 라우트 검증
```bash
# 등록된 라우트가 PRD와 일치하는지 확인
cd /home/claude/academy-mvp/backend
node -e "
const app = require('./src/app');
function printRoutes(stack, prefix='') {
  stack.forEach(layer => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).map(m=>m.toUpperCase()).join(',');
      console.log(methods, prefix + layer.route.path);
    } else if (layer.name === 'router' && layer.handle.stack) {
      const routerPrefix = layer.regexp.source.replace(/[\\\\\^\$\?\=\!\:]/g,'').replace(/\\\\\\//g,'/');
      printRoutes(layer.handle.stack, prefix + routerPrefix);
    }
  });
}
printRoutes(app._router.stack);
"
```

### JWT 인증 플로우 검증
```bash
# 회원가입 → 로그인 → 토큰으로 보호 라우트 접근 — 전체 플로우
# 1) 회원가입
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"verify@test.com","password":"Test1234!","name":"검증용","phone":"010-9999-9999"}'

# 2) 로그인 → 토큰 획득
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"verify@test.com","password":"Test1234!"}' \
  | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).accessToken))")

echo "Token: $TOKEN"

# 3) 보호 라우트 접근
curl -s http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $TOKEN"

# 4) 토큰 없이 접근 → 401 확인
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/users/me
```

### React 빌드 및 import 검증
```bash
cd /home/claude/academy-mvp/frontend

# 빌드 에러 확인
npx vite build 2>&1 | grep -iE "(error|failed)" | head -10

# 존재하지 않는 파일 import 확인
grep -rn "from '\.\./\|from '\./" src/ --include="*.jsx" --include="*.js" | while IFS= read -r line; do
  filepath=$(echo "$line" | cut -d: -f1)
  dir=$(dirname "$filepath")
  imported=$(echo "$line" | grep -oP "from '\K[^']+")
  if [ -n "$imported" ]; then
    resolved="$dir/$imported"
    if [ ! -f "$resolved" ] && [ ! -f "${resolved}.jsx" ] && [ ! -f "${resolved}.js" ] && [ ! -f "${resolved}/index.jsx" ] && [ ! -f "${resolved}/index.js" ]; then
      echo "❌ Missing: $filepath → $imported"
    fi
  fi
done
```

---

## Part 4: UI/UX 에이전트 (Academy UX Agent)

프론트엔드 컴포넌트·페이지를 작성하거나 수정할 때, 아래 기준을 **개발 단계에서부터** 적용한다. UI 완성 후 사후 점검이 아니라, 코드를 작성하는 시점에 이 원칙들을 반영하여 구현한다.

### 사용자 페르소나

이 시스템의 주 사용자는 **학원 선생님**이다. 다음 특성을 항상 염두에 둔다:

- **바쁘다**: 수업 직후 5~10분 안에 출석 체크 + 수업 종료 처리 + 알림 발송을 끝내야 한다
- **한 손 조작**: 태블릿이나 스마트폰을 한 손에 들고 서서 조작할 수 있다
- **IT 전문가가 아니다**: 직관적으로 이해할 수 없으면 사용하지 않는다
- **실수를 되돌릴 수 있어야 한다**: 출석 상태를 잘못 눌렀을 때 바로 수정 가능해야 한다
- **반복 작업이 많다**: 매일 같은 수업의 출석을 체크하므로, 최소 클릭으로 완료해야 한다

### UX 핵심 원칙 (개발 시 반드시 적용)

#### 원칙 1: 3클릭 이내 완료
주요 작업(출석 체크, 수업 종료, 알림 발송)은 시작부터 완료까지 **최대 3클릭**으로 끝나야 한다.

검증 방법: 각 핵심 플로우의 클릭 수를 카운트한다.
```
출석 체크: 대시보드 → [출석 체크] 클릭 → 학생별 상태 클릭 → [저장]  ≤ 3단계
수업 종료: 출석 완료 → [수업 종료 처리] → 정보 입력 → [알림 미리보기]  ≤ 3단계
알림 발송: 미리보기 확인 → [발송하기]  ≤ 1단계
```

#### 원칙 2: 터치 영역 최소 44px
모든 클릭/탭 가능한 요소(버튼, 체크박스, 라디오, 링크)의 터치 영역은 최소 44×44px 이상이다. 학원 선생님이 서서 한 손으로 조작할 때 오터치를 방지한다.

구현 기준:
```css
/* 버튼 최소 높이 */
.btn { min-height: 44px; min-width: 44px; padding: 10px 16px; }

/* 출석 상태 버튼 — 넉넉한 터치 영역 */
.attendance-btn { min-height: 48px; min-width: 72px; font-size: 16px; }

/* 모바일에서 더 크게 */
@media (max-width: 768px) {
  .btn { min-height: 48px; padding: 12px 20px; }
}
```

#### 원칙 3: 상태는 색상 + 아이콘 + 텍스트로 3중 표현
색각 이상 사용자를 포함해 누구나 상태를 즉시 인지할 수 있어야 한다.

```
출석: ✅ 초록배경 + 체크아이콘 + "출석" 텍스트
결석: ❌ 빨간배경 + X아이콘 + "결석" 텍스트
지각: ⚠️ 노란배경 + 경고아이콘 + "지각" 텍스트
미체크: ⬜ 회색테두리 + 빈 상태 + "미체크" 텍스트
```

#### 원칙 4: 즉각 피드백
모든 사용자 액션에 0.3초 이내 시각적 반응을 준다.

- **버튼 클릭**: 배경색 변경 + 미세한 scale 애니메이션
- **저장 성공**: 초록색 토스트 메시지 "저장되었습니다" (2초 후 자동 사라짐)
- **저장 실패**: 빨간색 토스트 메시지 + 구체적 에러 내용
- **로딩 중**: 버튼 내 스피너 + 버튼 비활성화 (중복 클릭 방지)
- **위험한 동작 (삭제 등)**: 확인 모달 필수 "정말 삭제하시겠습니까?"

구현 패턴 (Tailwind):
```jsx
// 버튼 피드백
<button
  className="transition-all duration-150 active:scale-95 disabled:opacity-50"
  disabled={isLoading}
>
  {isLoading ? <Spinner /> : '저장'}
</button>

// 토스트 알림 — 반드시 공통 컴포넌트로 구현
<Toast type="success" message="출석이 저장되었습니다" duration={2000} />
```

#### 원칙 5: 모바일 퍼스트 반응형
선생님은 교실에서 모바일/태블릿을 사용한다. 모든 페이지는 모바일 먼저 설계한다.

브레이크포인트:
```
모바일:  ~767px   → 1열 레이아웃, 풀 와이드 버튼, 큰 터치 영역
태블릿:  768~1023px → 2열 그리드 가능, 모달 사이즈 조정
데스크톱: 1024px~  → 사이드바 네비게이션, 넓은 카드 레이아웃
```

핵심 패턴:
```jsx
// 반응형 그리드
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// 모바일에서 풀와이드 버튼
<button className="w-full md:w-auto">

// 모바일에서 바텀시트 스타일 모달
<Modal className="fixed inset-x-0 bottom-0 md:relative md:max-w-lg md:mx-auto rounded-t-2xl md:rounded-xl">
```

#### 원칙 6: 일관된 네비게이션 패턴
사용자가 현재 위치를 항상 알 수 있고, 한 단계 전으로 돌아갈 수 있어야 한다.

- **상단 네비게이션 바**: 항상 표시, 로고 + 현재 위치 + 사용자 메뉴
- **뒤로가기 버튼**: 서브 페이지에서 항상 좌측 상단에 표시
- **브레드크럼**: 깊은 단계(수업 > 학생 관리 > 학생 상세)에서 경로 표시
- **하단 탭 바 (모바일)**: 대시보드 / 수업 / 학생 / 설정 — 4개 이하 탭

```jsx
// 모바일 하단 탭 바
<nav className="fixed bottom-0 inset-x-0 bg-white border-t md:hidden">
  <div className="flex justify-around py-2">
    <TabItem icon={Home} label="홈" to="/dashboard" />
    <TabItem icon={Book} label="수업" to="/classes" />
    <TabItem icon={Users} label="학생" to="/students" />
    <TabItem icon={Settings} label="설정" to="/settings" />
  </div>
</nav>
```

#### 원칙 7: 빈 상태(Empty State) & 온보딩
데이터가 없는 상태를 방치하지 않는다. 다음 행동을 유도하는 안내를 보여준다.

```
수업 0개:  "아직 등록된 수업이 없습니다" + [첫 수업 만들기] 버튼
학생 0명:  "수업에 학생을 추가해 보세요" + [학생 추가] 버튼
출석 기록 없음: "오늘 출석을 체크해 주세요" + [출석 체크 시작] 버튼
알림 내역 없음: "아직 발송한 알림이 없습니다"
```

#### 원칙 8: 폼 UX
선생님이 수업 직후 빠르게 입력할 수 있도록 폼을 최적화한다.

- **필수 항목 표시**: 라벨 옆에 빨간 * 표시
- **실시간 유효성 검사**: 포커스 아웃 시 즉시 에러 표시 (제출 후 한꺼번에 보여주지 않음)
- **기본값 설정**: 날짜는 오늘, 시간은 수업 시간표에서 자동 세팅
- **자동 포커스**: 모달 열릴 때 첫 번째 입력 필드에 포커스
- **키보드 타입**: 전화번호는 tel, 이메일은 email 타입 사용
- **탭 순서**: 논리적 입력 순서로 tab index 설정

```jsx
// 전화번호 입력 — 자동 하이픈
<input
  type="tel"
  inputMode="numeric"
  placeholder="010-0000-0000"
  onChange={(e) => setPhone(formatPhone(e.target.value))}
  className="..."
/>

// 실시간 유효성 검사
<input
  onBlur={() => validateField('email')}
  className={errors.email ? 'border-red-500' : 'border-gray-300'}
/>
{errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
```

### UX 검증 체크리스트

프론트엔드 컴포넌트를 작성한 뒤, STEP 2(자체 오류 점검)에서 기능 검증과 **함께** 아래 UX 항목도 확인한다.

```
━━━ UX 검증 ━━━
📱 대상: [페이지/컴포넌트명]

터치 & 조작
  □ 모든 버튼/링크의 터치 영역이 44px 이상인가?
  □ 클릭 시 즉각 시각 피드백이 있는가?
  □ 로딩 중 버튼이 비활성화되어 중복 클릭을 방지하는가?
  □ 삭제 등 위험 동작에 확인 모달이 있는가?

레이아웃 & 반응형
  □ 모바일(375px)에서 가로 스크롤 없이 정상 표시되는가?
  □ 태블릿(768px), 데스크톱(1024px)에서 레이아웃이 적절한가?
  □ 모바일에서 하단 탭 바가 콘텐츠를 가리지 않는가? (하단 패딩)

상태 표현
  □ 출석/결석/지각이 색상+아이콘+텍스트 3중으로 표현되는가?
  □ 빈 상태(데이터 0건)에서 안내 메시지와 행동 유도 버튼이 있는가?
  □ 성공/실패 토스트가 적절히 노출되는가?

폼 & 입력
  □ 필수 항목에 * 표시가 있는가?
  □ 유효성 검사가 포커스 아웃 시 즉시 표시되는가?
  □ 날짜/시간 기본값이 합리적으로 설정되는가?
  □ 전화번호에 자동 하이픈이 적용되는가?

네비게이션
  □ 현재 위치를 사용자가 알 수 있는가? (활성 메뉴 강조 등)
  □ 뒤로가기가 가능한가?
  □ 핵심 작업이 3클릭 이내에 완료되는가?

접근성
  □ 폰트 크기가 최소 14px (모바일 본문) 이상인가?
  □ 색상 대비가 WCAG AA 기준(4.5:1)을 충족하는가?
  □ input에 적절한 label과 placeholder가 있는가?
━━━━━━━━━━━━━━━━
```

### UI 컬러 시스템

프로젝트 전체에서 일관되게 사용하는 색상 팔레트:

```javascript
// tailwind.config.js에 확장 등록
colors: {
  primary: {
    50:  '#EFF6FF',  // 배경, 호버
    100: '#DBEAFE',  // 연한 강조
    500: '#3B82F6',  // 기본 버튼, 링크
    600: '#2563EB',  // 호버
    700: '#1D4ED8',  // 활성
  },
  success: {
    50:  '#F0FDF4',  // 출석 배경
    500: '#22C55E',  // 출석 텍스트/아이콘
    600: '#16A34A',  // 출석 호버
  },
  danger: {
    50:  '#FEF2F2',  // 결석 배경
    500: '#EF4444',  // 결석 텍스트/아이콘, 에러
    600: '#DC2626',  // 결석 호버, 삭제 버튼
  },
  warning: {
    50:  '#FFFBEB',  // 지각 배경
    500: '#F59E0B',  // 지각 텍스트/아이콘
    600: '#D97706',  // 지각 호버
  },
  gray: {
    50:  '#F9FAFB',  // 페이지 배경
    100: '#F3F4F6',  // 카드 배경 (대안)
    200: '#E5E7EB',  // 보더
    400: '#9CA3AF',  // 비활성 텍스트
    600: '#4B5563',  // 보조 텍스트
    900: '#111827',  // 기본 텍스트
  }
}
```

### 공통 컴포넌트 설계 기준

아래 공통 컴포넌트를 `components/common/`에 만들고, 모든 페이지에서 재사용한다. 페이지마다 개별 스타일링하지 않는다.

| 컴포넌트 | 역할 | 핵심 props |
|---------|------|-----------|
| `Button` | 모든 버튼 | variant(primary/danger/ghost), size(sm/md/lg), isLoading, fullWidth |
| `Input` | 텍스트 입력 | label, error, required, type |
| `Modal` | 모달/바텀시트 | isOpen, onClose, title, size(sm/md/lg) |
| `Toast` | 알림 토스트 | type(success/error/info), message, duration |
| `Card` | 카드 컨테이너 | padding, hoverable, onClick |
| `EmptyState` | 빈 상태 안내 | icon, title, description, actionLabel, onAction |
| `Navbar` | 상단 네비게이션 | title, showBack, onBack |
| `BottomTab` | 모바일 하단 탭 | tabs[], activeTab |
| `Badge` | 상태 뱃지 | variant(success/danger/warning/gray), label |
| `Spinner` | 로딩 스피너 | size(sm/md) |
