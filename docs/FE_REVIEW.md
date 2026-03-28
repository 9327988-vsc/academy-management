# FE 검수 결과

**검수일:** 2026-03-28
**담당:** FE Review Agent

---

## 심각 (즉시 수정 필요) — 5건 → 모두 수정 완료

| # | 파일 | 문제 | 상태 |
|---|------|------|------|
| 1 | App.tsx | ClassDetailPage 미구현 (/classes/:id 라우트 누락) | 수정 완료 |
| 2 | AttendancePage.tsx | 동적 Tailwind 클래스 — cn() 미사용 | 수정 완료 |
| 3 | 여러 페이지 | 에러 핸들링 누락 (.catch(() => {})) | 수정 완료 |
| 4 | 여러 페이지 | catch 블록 비어있음 (/* handled by UI */) | 수정 완료 |
| 5 | AttendancePage, NotificationPage | alert() 사용 → Toast로 변경 | 수정 완료 |

## 경고 (수정 권장) — 12건 → Phase 2에서 개선

1. react-hook-form 미사용 (useState로 폼 관리)
2. TanStack Query 미사용 (수동 useEffect + useState)
3. DRY 위반 — fetch 패턴 반복 (커스텀 훅 추출 권장)
4. 접근성(a11y) 부분 미흡 — aria-label 추가 필요
5. 반응형 sm: 브레이크포인트 미적용
6. 컴포넌트 분리 부족 (페이지에 로직 집중)
7. ApiResponse 제네릭 미활용
8. 로딩 상태 Skeleton 일관성
9. SessionListPage 별도 미구현 (ClassDetailPage 탭으로 대체)
10. Form 유효성 검사 (required만 사용)
11. URL 파라미터 방어 로직
12. 디자인 토큰 직접 사용 권장 (hardcoded Tailwind 색상)

## 정보 (참고)

- 전체 8개 페이지 구현 완료 (ClassDetailPage 추가)
- TypeScript 타입 체크 통과 (에러 0건)
- shadcn/ui 컴포넌트 활용 양호
- Axios interceptor 토큰 자동 갱신 정상
