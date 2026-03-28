@echo off
echo ========================================
echo 학원관리시스템을 시작합니다...
echo ========================================
echo.
echo 백엔드 서버를 시작합니다...
start "백엔드 서버" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak > nul
echo.
echo 프론트엔드 서버를 시작합니다...
start "프론트엔드 서버" cmd /k "cd frontend && npm run dev"
echo.
echo 두 서버가 시작되었습니다!
echo 브라우저에서 http://localhost:5173 을 열어주세요.
pause
