@echo off
REM Batch file to generate menu.json from courses folder
REM Author: Ejagruti
REM Description: Automatically generates menu.json by reading the courses folder structure

::Set color and title
color 0A
title Ejagruti Menu Generator

::Change to the script directory
cd /d "%~dp0"

::Check if UV is installed
uv --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo =========================================================
    echo ERROR: UV is not installed or not in PATH
    echo =========================================================
    echo.
    echo Please install UV from: https://docs.astral.sh/uv/
    echo or run: winget install --id=astral-sh.uv -e
    echo.
    pause
    exit /b 1
)

::Run the menu generator
echo.
echo =========================================================
echo   Starting Ejagruti Menu Generator

echo =========================================================
echo.

uv run python menu.py

::Check if successful
if errorlevel 1 (
    color 0C
    echo.
    echo =========================================================
    echo ERROR: Failed to generate menu.json
    echo =========================================================
    echo.
) else (
    color 0B
    echo.
    echo =========================================================
    echo SUCCESS: menu.json has been generated!
    echo =========================================================
    echo.
)

color 0A
pause
