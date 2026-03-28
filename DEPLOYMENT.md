# 배포 가이드 (Railway + Vercel)

**목표:** 설치 없이 URL만으로 누구나 접속 가능한 웹사이트

| 서비스 | 플랫폼 | 무료 플랜 |
|--------|--------|-----------|
| 백엔드 API | Railway | $5 크레딧/월 |
| MySQL DB | Railway | 포함 |
| 프론트엔드 | Vercel | 무료 |

---

## 1단계: GitHub 저장소 준비

```bash
cd 01-학생관리

# Git 초기화 (아직 안 했다면)
git init
git add -A
git commit -m "Initial commit: ASMS 학원관리시스템"

# GitHub에 저장소 생성 후
git remote add origin https://github.com/YOUR_USERNAME/academy-management.git
git push -u origin main
```

---

## 2단계: Railway 백엔드 배포

### 2-1. Railway 가입 및 프로젝트 생성

1. https://railway.app 접속, GitHub 계정으로 가입
2. **New Project** 클릭
3. **Deploy from GitHub Repo** 선택
4. 저장소 연결

### 2-2. MySQL 데이터베이스 추가

1. Railway 프로젝트 대시보드에서 **+ New** 클릭
2. **Database** → **MySQL** 선택
3. 생성 완료 대기 (약 30초)

### 2-3. 백엔드 서비스 설정

1. **+ New** → **GitHub Repo** → 저장소 선택
2. **Settings** 탭:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

3. **Variables** 탭에서 환경변수 설정:

```
DATABASE_URL       → MySQL 서비스의 연결 URL (Railway가 자동 제공)
JWT_SECRET         → (32자 이상 랜덤 문자열 생성)
JWT_REFRESH_SECRET → (32자 이상 랜덤 문자열 생성)
NODE_ENV           → production
PORT               → 4000
CORS_ORIGIN        → (3단계에서 Vercel URL 확정 후 입력)
```

**JWT 시크릿 생성 (터미널):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2-4. MySQL 연결

Railway의 MySQL 서비스 클릭 → **Connect** 탭에서 `DATABASE_URL` 복사.
백엔드 서비스의 Variables에 붙여넣기.

### 2-5. 배포 확인

Railway가 자동으로 빌드 + 배포합니다. 로그에서 확인:
```
[ASMS] Server running on http://localhost:4000
```

**생성된 URL 확인:** Settings → Networking → Public URL
예: `https://academy-backend-production.up.railway.app`

헬스체크:
```bash
curl https://YOUR_RAILWAY_URL/api/health
# {"success":true,"message":"ASMS API is running"}
```

---

## 3단계: Vercel 프론트엔드 배포

### 3-1. Vercel 가입 및 프로젝트 생성

1. https://vercel.com 접속, GitHub 계정으로 가입
2. **Add New Project** 클릭
3. GitHub 저장소 연결

### 3-2. 프로젝트 설정

- **Root Directory:** `frontend`
- **Framework Preset:** Vite (자동 감지)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### 3-3. 환경변수 설정

**Environment Variables** 섹션에서:

```
VITE_API_URL = https://YOUR_RAILWAY_URL/api
```

(2단계에서 확인한 Railway 백엔드 URL + `/api`)

### 3-4. 배포

**Deploy** 버튼 클릭. 빌드 완료 후 URL 확인.
예: `https://academy-management.vercel.app`

### 3-5. Railway CORS 업데이트

Vercel URL이 확정되면 Railway 환경변수 업데이트:

```
CORS_ORIGIN = https://academy-management.vercel.app
```

Railway가 자동 재배포됩니다.

---

## 4단계: 최종 확인

### 체크리스트

- [ ] 백엔드 헬스체크: `https://RAILWAY_URL/api/health`
- [ ] 프론트엔드 접속: `https://VERCEL_URL`
- [ ] 회원가입 동작
- [ ] 로그인 동작
- [ ] 수업 생성 동작
- [ ] 학생 추가 동작
- [ ] 출석 체크 동작
- [ ] 알림 발송 동작

### 시드 데이터 (선택)

Railway 배포 후 테스트 데이터를 넣으려면:

```bash
# 로컬에서 Railway DB에 직접 연결
DATABASE_URL="Railway에서 복사한 External URL" npx ts-node prisma/seed.ts
```

---

## 트러블슈팅

### Railway 빌드 실패
- `Root Directory`가 `backend`로 설정되었는지 확인
- `prisma`가 dependencies에 있는지 확인 (devDependencies X)

### Vercel CORS 에러
- Railway 환경변수 `CORS_ORIGIN`이 Vercel URL과 정확히 일치하는지 확인
- URL 끝에 슬래시(`/`)가 없어야 함

### DB 마이그레이션 실패
- Railway MySQL 서비스가 Running 상태인지 확인
- `DATABASE_URL`이 올바른지 확인 (Railway Connect 탭에서 복사)

### "JWT_SECRET must be set" 에러
- Railway Variables에 `JWT_SECRET`, `JWT_REFRESH_SECRET`이 설정되었는지 확인

---

## 배포 후 관리

### 자동 배포
GitHub `main` 브랜치에 push하면 Railway + Vercel 모두 자동 재배포.

### 로그 확인
- Railway: 프로젝트 → 서비스 → Logs 탭
- Vercel: 프로젝트 → Functions → Logs

### DB 관리
- Railway: MySQL 서비스 → Data 탭 (웹 GUI)
- 로컬: Prisma Studio (`DATABASE_URL` 설정 후 `npx prisma studio`)
