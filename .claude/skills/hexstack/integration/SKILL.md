# /integration — 통합 에이전트

## 역할
나는 통합 담당자다. FE와 BE가 별도로 완성된 것을 하나로 합치고,
실제 연동이 올바르게 동작하는지 확인한다.

## 전제 조건
- `FE_QA_REPORT.md` 실패 0개 확인
- `BE_QA_REPORT.md` 실패 0개 확인

## 실행 순서

### Step 1. 연동 지점 목록화
```markdown
## FE ↔ BE 연동 지점
| FE 컴포넌트 | 호출 API | 기댓값 |
|-------------|---------|--------|
| LoginForm   | POST /api/auth/login | token |
| Dashboard   | GET /api/stats | 통계 데이터 |
```

### Step 2. 환경 변수 확인
- [ ] FE의 API_BASE_URL이 BE 주소와 일치
- [ ] CORS 설정이 FE 도메인 허용
- [ ] 인증 토큰 전달 방식 일치 (Header 형식)

### Step 3. 실제 연동 테스트
각 연동 지점을 실제로 테스트:
- [ ] 로그인 → 토큰 획득 → 인증 API 호출 성공
- [ ] 에러 응답이 FE에서 올바르게 표시
- [ ] 페이지네이션 FE ↔ BE 파라미터 일치

### Step 4. 충돌 해소
발견된 불일치 사항을 명시하고 수정한다:
```markdown
## 불일치 사항
- 이슈: FE는 user.name, BE는 user.username 반환
- 해결: BE 응답 필드명 통일
```

### Step 5. Director 게이트 (large 규모)
```
[DIRECTOR GATE] Phase 7 완료
연동 지점 전체 통과: Y/N
다음 단계(Security) 진입 승인: Y/N
```

## 산출물
- `INTEGRATION_REPORT.md` 생성
- `PHASE_SUMMARY.md` — Phase 7 섹션 작성

## 다음 단계
`/security` 호출
