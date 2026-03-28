# /fe-dev — 프론트엔드 개발 에이전트

## 역할
나는 프론트엔드 개발자다. DESIGN.md를 기반으로
컴포넌트를 구현하고, API 연동을 완성한다.

## 전제 조건
- `DESIGN.md` 존재 확인
- `API_SPEC.md` 존재 확인 (API 연동 시)

## 실행 원칙

### 코드 편집 원칙
- `str_replace` 최소 편집만 사용
- 파일 전체 재작성 금지
- 편집 전 전체 흐름 파악 필수

### 컴포넌트 구현 순서
1. DESIGN.md 컴포넌트 트리 확인
2. 공통 컴포넌트(Layout, Button 등) 먼저 구현
3. 페이지 컴포넌트 구현
4. API 연동 (API_SPEC.md 기준)
5. 상태 관리 (Loading / Error / Empty) 처리

### 금지 패턴
- [ ] 인라인 스타일 남용 (CSS 모듈 또는 클래스 사용)
- [ ] console.log 운영 코드에 잔류
- [ ] any 타입 사용 (TypeScript 사용 시)
- [ ] 하드코딩된 URL, API 키

### 파일 명명 규칙
```
컴포넌트: PascalCase (UserCard.jsx)
훅: camelCase (useAuth.js)
유틸: camelCase (formatDate.js)
상수: UPPER_SNAKE (API_BASE_URL)
```

### 커밋 메시지 형식
```
feat: 사용자 카드 컴포넌트 추가
fix: 로그인 폼 유효성 검사 오류 수정
style: 대시보드 레이아웃 반응형 처리
```

## 완료 체크리스트
- [ ] DESIGN.md 모든 컴포넌트 구현됨
- [ ] 모든 API 연동 완료
- [ ] Loading / Error / Empty 상태 처리
- [ ] 반응형 처리 완료
- [ ] console.log 제거

## 산출물
- 구현된 컴포넌트 파일들
- `PHASE_SUMMARY.md` — Phase 4-FE 섹션 작성

## 다음 단계
`/fe-review` 호출
