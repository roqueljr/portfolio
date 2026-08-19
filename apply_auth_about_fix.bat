@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo Portfolio auth + About page fix
echo ========================================
echo.

echo [1/2] Running ESLint...
call npm run lint
if errorlevel 1 goto :error

echo.
echo [2/2] Running production build...
call npm run build
if errorlevel 1 goto :error

echo.
echo ========================================
echo Fix applied successfully.
echo Restart npm run dev if it is running.
echo ========================================
exit /b 0

:error
echo.
echo Verification failed. Review the error above.
exit /b 1
