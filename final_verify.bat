@echo off
setlocal
cd /d "%~dp0"
echo Running post-migration verification...
call npm run verify || goto :fail
call npm run lint || goto :fail
call npm run build || goto :fail
echo.
echo All post-migration checks passed.
exit /b 0
:fail
echo.
echo A verification step failed. Review the output above.
exit /b 1
