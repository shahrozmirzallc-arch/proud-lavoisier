@echo off
title PC Security Agent Launcher
echo Checking system credentials...

:: Check for administrative privileges
net session >nul 2>&1
if %errorLevel% neq 0 goto ELEVATE

echo [OK] Administrative privileges confirmed.
echo Navigating to project directory...
cd /d "C:\Users\Sharoz\Documents\antigravity\proud-lavoisier"
echo Starting Security Agent...
python security_agent.py

if %errorLevel% neq 0 (
    echo.
    echo [ERROR] Python agent exited with error code %errorLevel%.
    echo Please review the error above.
    pause
)
goto END

:ELEVATE
echo [INFO] Requesting Administrator Elevation (UAC)...
powershell -Command "Start-Process '%~f0' -Verb RunAs"
goto END

:END
