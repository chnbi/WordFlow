@echo off
echo ==========================================
echo Translation Wrapper - Setup Script
echo ==========================================
echo.

echo [1/5] Installing root dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)
echo.

echo [2/5] Installing backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..
echo.

echo [3/5] Installing frontend dependencies...
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..
echo.

echo [4/5] Creating environment files...

if not exist "backend\.env" (
    echo Creating backend/.env...
    (
        echo NODE_ENV=development
        echo PORT=3000
        echo MONGODB_URI=mongodb://localhost:27017/translation-wrapper
        echo GEMINI_API_KEY=
        echo GOOGLE_CLOUD_VISION_API_KEY=
        echo GCP_PROJECT_ID=
        echo JWT_SECRET=translation-wrapper-dev-secret
        echo CORS_ORIGIN=http://localhost:5173
        echo MAX_FILE_SIZE=10485760
        echo UPLOAD_DIR=./uploads
        echo EXPORT_DIR=./exports
    ) > backend\.env
    echo backend/.env created
) else (
    echo backend/.env already exists
)

if not exist "frontend\.env" (
    echo Creating frontend/.env...
    (
        echo VITE_API_URL=http://localhost:3000/api
    ) > frontend\.env
    echo frontend/.env created
) else (
    echo frontend/.env already exists
)
echo.

echo [5/5] Creating required directories...
if not exist "backend\uploads" mkdir backend\uploads
if not exist "backend\exports" mkdir backend\exports
echo Directories created
echo.

echo ==========================================
echo Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Make sure MongoDB is running
echo 2. Run: cd backend
echo 3. Run: node seed.js (to add sample glossary)
echo 4. Run: cd ..
echo 5. Run: npm run dev (to start the app)
echo.
echo The app will be available at:
echo - Frontend: http://localhost:5173
echo - Backend:  http://localhost:3000/api
echo.
echo For detailed instructions, see QUICKSTART.md
echo.
pause
