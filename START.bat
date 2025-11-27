@echo off
echo ==========================================
echo Translation Wrapper - Starting Application
echo ==========================================
echo.

echo Checking MongoDB...
sc query MongoDB | find "RUNNING" >nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: MongoDB service is not running!
    echo Please start MongoDB first:
    echo   1. Open Services (services.msc)
    echo   2. Find "MongoDB" and click Start
    echo   OR use MongoDB Atlas (cloud database)
    echo.
    pause
    exit /b 1
)
echo MongoDB is running!
echo.

echo Starting Translation Wrapper...
echo.
echo Backend will run on: http://localhost:3000/api
echo Frontend will run on: http://localhost:5173
echo.
echo Press Ctrl+C to stop the application
echo.

npm run dev
