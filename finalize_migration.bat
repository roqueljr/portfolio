@echo off
setlocal
cd /d "%~dp0"

echo Removing one-time Base44 migration files...
if exist "migration" rmdir /s /q "migration"
if exist "scripts\export-base44.js" del /q "scripts\export-base44.js"
if exist "scripts\import-base44-json.js" del /q "scripts\import-base44-json.js"
if exist "scripts\migrate-media.js" del /q "scripts\migrate-media.js"
if exist "MIGRATION_GUIDE.md" del /q "MIGRATION_GUIDE.md"
if exist "MIGRATION_STATUS.md" del /q "MIGRATION_STATUS.md"
if exist "SECURITY_DEPENDENCY_FIX.md" del /q "SECURITY_DEPENDENCY_FIX.md"
if exist "apply_security_fix.bat" del /q "apply_security_fix.bat"

echo.
echo Running database verification...
call npm run verify || goto :fail

echo.
if exist "package-lock.json" (
  echo Running npm security audit...
  call npm audit || goto :fail
  echo.
)
echo Running lint...
call npm run lint || goto :fail

echo.
echo Running production build...
call npm run build || goto :fail

echo.
echo Migration finalization completed successfully.
exit /b 0

:fail
echo.
echo Finalization stopped because a verification step failed.
exit /b 1
