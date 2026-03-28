# 문제 해결 가이드 (Troubleshooting)

---

## MySQL 관련

### "Access denied for user 'root'@'localhost'"
**원인:** MySQL 비밀번호가 `.env`의 `DATABASE_URL`과 불일치

**해결:**
```bash
# 1. MySQL 접속 확인
mysql -u root -p

# 2. 접속 성공 시 .env의 DATABASE_URL 비밀번호 수정
# 특수문자 URL 인코딩: @ → %40, # → %23, ! → %21
DATABASE_URL="mysql://root:YourP%40ssword@localhost:3306/academy"
```

### "Unknown database 'academy'"
**원인:** academy 데이터베이스 미생성

**해결:**
```bash
mysql -u root -p -e "CREATE DATABASE academy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### "Can't connect to MySQL server on 'localhost'"
**원인:** MySQL 서비스 미실행

**해결 (Windows):**
```bash
# 서비스 확인
net start | findstr /i mysql

# 서비스 시작 (관리자 권한)
net start MySQL80
```

---

## Prisma 관련

### "P1000: Authentication failed"
**원인:** DATABASE_URL의 비밀번호 인코딩 문제

**해결:**
```bash
# Node.js로 연결 테스트
cd backend
node -e "
const mysql = require('mysql2/promise');
(async()=>{
  const c = await mysql.createConnection({host:'localhost',user:'root',password:'YOUR_PASSWORD'});
  console.log('OK');
  await c.end();
})().catch(e=>console.log('FAIL:',e.message));
"
```

### "P1001: Can't reach database server"
**원인:** MySQL이 3306 포트에서 실행되지 않음

**해결:**
```bash
# 포트 확인
netstat -an | findstr 3306
```

### "prisma migrate dev 실패"
**해결:**
```bash
# 마이그레이션 초기화 (데이터 유실 주의)
npx prisma migrate reset

# 또는 DB를 직접 push
npx prisma db push
```

---

## 서버 관련

### "EADDRINUSE: address already in use :::4000"
**원인:** 이전 서버 프로세스가 종료되지 않음

**해결 (Windows):**
```bash
# 4000 포트 사용 프로세스 찾기
netstat -ano | findstr :4000

# 프로세스 종료 (PID 확인 후)
taskkill /PID <PID번호> /F
```

### "JWT_SECRET must be set"
**원인:** `.env` 파일이 없거나 JWT_SECRET이 미설정

**해결:**
```bash
cd backend
cp .env.example .env
# .env 파일의 JWT_SECRET, JWT_REFRESH_SECRET 값 확인
```

---

## 프론트엔드 관련

### "CORS 에러" (브라우저 콘솔)
**원인:** 백엔드의 CORS 설정과 프론트엔드 URL 불일치

**해결:**
```env
# backend/.env
CORS_ORIGIN="http://localhost:5173"
```

### "Network Error" / API 호출 실패
**원인:** 백엔드 서버 미실행

**해결:**
1. 백엔드 서버 실행 확인: `curl http://localhost:4000/api/health`
2. 프론트엔드 API URL 확인: `frontend/src/api/client.ts`의 `API_BASE_URL`

### shadcn/ui 컴포넌트 추가 실패
**해결:**
```bash
cd frontend
npx shadcn@latest add <component-name>
```

---

## TypeScript 관련

### "Cannot find module '@/...'"
**원인:** path alias 설정 문제

**확인:**
- `frontend/tsconfig.json` — `paths: {"@/*": ["./src/*"]}`
- `frontend/tsconfig.app.json` — 동일 설정
- `frontend/vite.config.ts` — `resolve.alias`

### 타입 에러 확인
```bash
# 백엔드
cd backend && npx tsc --noEmit

# 프론트엔드
cd frontend && npx tsc --noEmit
```
