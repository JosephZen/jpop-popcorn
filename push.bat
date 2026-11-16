@echo off
REM ==============================================================================
REM J-Pop Corner - Automated Git Add, Commit & Push Batch Script (Windows)
REM Usage:
REM   push.bat "Your commit message here"
REM   or simply: push.bat
REM ==============================================================================

echo ====================================================
echo    J-Pop Corner: Git Stage, Commit ^& Push Script
echo ====================================================

set COMMIT_MSG=%~1
if "%COMMIT_MSG%"=="" (
    set /p COMMIT_MSG="Enter commit message (or press Enter for default): "
)
if "%COMMIT_MSG%"=="" (
    set COMMIT_MSG=update: %date% %time%
)

echo.
echo Staging all project changes...
git add -A

echo Committing with message: "%COMMIT_MSG%"
git commit -m "%COMMIT_MSG%"

echo.
echo Pushing to remote repository...
git push origin main

echo.
echo ====================================================
echo Successfully pushed changes to GitHub!
echo ====================================================
