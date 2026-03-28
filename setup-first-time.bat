@echo off
echo ========================================
echo 최초 설정을 시작합니다...
echo ========================================
echo.
echo [1/4] 서버 의존성 설치...
cd backend
call npm install
echo.
echo [2/4] Prisma 설정...
call npx prisma generate
call npx prisma migrate dev
echo.
echo [3/4] 클라이언트 의존성 설치...
cd ..\frontend
call npm install
echo.
echo [4/4] 설정 완료!
echo.
echo 이제 start-all.bat 파일을 실행하세요.
pause
