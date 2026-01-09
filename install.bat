@echo off
echo ========================================
echo Reliability Simulator - Installation
echo ========================================
echo.

echo Installing root dependencies...
call npm install
if %errorlevel% neq 0 goto :error

echo.
echo Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 goto :error
cd ..

echo.
echo Installing client dependencies...
cd client
call npm install
if %errorlevel% neq 0 goto :error
cd ..

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo To start the application, run:
echo   npm run dev
echo.
echo Then open: http://localhost:3000
echo.
pause
exit /b 0

:error
echo.
echo ========================================
echo Installation Failed!
echo ========================================
echo Please check the error messages above.
echo.
pause
exit /b 1
