# HexStack 방법론 — 프로젝트 헌법

## 설계 의도 및 배경

HexStack은 1인 개발자가 AI(Claude Code)를 활용해 **팀 수준의 품질**을 유지하면서 개발할 수 있도록
설계된 방법론이다. ProjectOS v4.0의 거버넌스 철학(보안·QA·승인 체계)과 gstack의 즉시 실행 가능한
스킬팩 구조를 통합하여, 단계별로 전문 에이전트가 역할을 분담하는 가상 개발팀을 구현한다.

**핵심 문제 의식:**
- AI를 범용 도구로 쓰면 결과물이 평범해진다
- 역할을 분리하면 각 단계의 품질이 극적으로 올라간다
- 멀티세션 개발에서 컨텍스트 단절은 런타임 통합 실패로 이어진다

---

## 단계 순서 (반드시 준수)

```
① 기획 → ② 설계 → ③ 디자인(FE/BE 병렬) → ④ 코딩(FE/BE 병렬)
→ ⑤ 검수(FE/BE 병렬) → ⑥ 테스트(FE/BE 병렬)
→ ⑦ 통합 → ⑧ 통합 테스트 → ⑨ 배포 → ⑩ 회고
```

각 단계 진입 전 반드시 해당 SKILL.md를 호출하라.

---

## 태스크 규모 설정

프로젝트 시작 시 반드시 아래 중 하나를 선언한다:

```
TASK_SCALE=small   # 단순 기능 추가, 버그 수정
TASK_SCALE=medium  # 신규 페이지, 모듈 단위 개발
TASK_SCALE=large   # 신규 서비스, 전체 리팩토링
```

| 규모 | 필수 단계 | Director 승인 | Security 체크 |
|------|-----------|---------------|---------------|
| small | ①②④⑤⑨ | 생략 가능 | 간이(10개) |
| medium | ①②③④⑤⑥⑦⑨⑩ | ②⑦에서 필요 | 표준(20개) |
| large | 전체 10단계 | 매 단계 필요 | 전체(39개) |

---

## 에이전트 맵

| 단계 | 슬래시 커맨드 | 에이전트 역할 |
|------|--------------|--------------|
| ① 기획 | `/office-hours` | 전제 검증, 방향 설정 |
| ② 설계 | `/eng-review` | 아키텍처·데이터 흐름 확정 |
| ③ 디자인(FE) | `/ui-design` | 컴포넌트 설계, DESIGN.md 생성 |
| ③ 디자인(BE) | `/schema-design` | DB 스키마, API 명세 설계 |
| ④ 코딩(FE) | `/fe-dev` | 컴포넌트·라우팅·스타일 구현 |
| ④ 코딩(BE) | `/be-dev` | API·DB·비즈니스 로직 구현 |
| ⑤ 검수(FE) | `/fe-review` | UI 버그·접근성·AI slop 탐지 |
| ⑤ 검수(BE) | `/be-review` | 로직 버그·보안 취약점 탐지 |
| ⑥ 테스트(FE) | `/fe-qa` | 실브라우저 E2E 테스트 |
| ⑥ 테스트(BE) | `/be-qa` | API·DB 단위/통합 테스트 |
| ⑦ 통합 | `/integration` | FE/BE 병합, 충돌 해소 |
| ⑧ 통합 테스트 | `/security` | 보안 39개 항목 검증 |
| ⑨ 배포 | `/release` | 카나리 배포, 롤백 준비 |
| ⑩ 회고 | `/retro` | LOC·PR·품질 지표 리뷰 |

---

## 절대 금지 명령

```
⛔ npm run dev, npm run build
⛔ node index.js, node server.js
⛔ kill, pkill, lsof
⛔ git push --force
⛔ DROP TABLE (Security Agent 승인 없이)
```

---

## 코드 편집 원칙

- `str_replace` 최소 편집만 허용 — 파일 전체 재작성 금지
- 편집 전 반드시 해당 파일 전체 흐름 파악 후 사이드이펙트 검토
- 수정 범위를 먼저 선언하고 승인 후 편집 시작

---

## 단계 완료 기준 (PHASE_SUMMARY.md)

각 단계 완료 시 반드시 `PHASE_SUMMARY.md`를 생성 또는 업데이트한다.

```markdown
## Phase N 완료 — [단계명]
- 완료 일시:
- 담당 에이전트:
- 주요 결정사항:
- 변경된 파일 목록:
- 다음 단계 진입 조건:
- 미해결 이슈:
```

다음 에이전트는 반드시 이 파일을 첫 컨텍스트로 로드한다.

---

## Director 승인 게이트 (large 규모)

아래 단계 진입 전 Director 확인 필수:
- ② 설계 완료 → ③ 디자인 진입 전
- ⑦ 통합 완료 → ⑧ 통합 테스트 진입 전
- ⑨ 배포 직전

Director 확인 형식:
```
[DIRECTOR GATE] Phase N → Phase N+1
- 이전 단계 산출물: 확인됨 / 미완료
- 진입 승인: Y / N
- 조건부 승인 사항:
```

---

## 세션 종료 시 필수 산출물

매 세션 종료 전 아래를 제공한다:

1. PHASE_SUMMARY.md 업데이트
2. 변경 파일 목록 (git diff --name-only 기준)
3. 다음 세션 시작 브리핑 (3줄 이내)
4. 미완료 태스크 목록

---

## 스킬 파일 위치

```
.claude/skills/hexstack/
├── office-hours/SKILL.md    # ① 기획
├── eng-review/SKILL.md      # ② 설계
├── ui-design/SKILL.md       # ③ 디자인(FE)
├── schema-design/SKILL.md   # ③ 디자인(BE)
├── fe-dev/SKILL.md          # ④ 코딩(FE)
├── be-dev/SKILL.md          # ④ 코딩(BE)
├── fe-review/SKILL.md       # ⑤ 검수(FE)
├── be-review/SKILL.md       # ⑤ 검수(BE)
├── fe-qa/SKILL.md           # ⑥ 테스트(FE)
├── be-qa/SKILL.md           # ⑥ 테스트(BE)
├── integration/SKILL.md     # ⑦ 통합
├── security/SKILL.md        # ⑧ 통합 테스트
├── release/SKILL.md         # ⑨ 배포
└── retro/SKILL.md           # ⑩ 회고
```
