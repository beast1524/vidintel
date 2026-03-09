@echo off
echo ========================================
echo   VidIntel - Starting Full Stack App
echo ========================================
echo.

:: Start Ollama in background
echo [1/3] Starting Ollama...
start "Ollama" cmd /k "ollama serve"
timeout /t 2 /nobreak >nul

:: Start FastAPI backend
echo [2/3] Starting FastAPI backend...
start "Backend" cmd /k "cd backend && venv\Scripts\activate && python main.py"
timeout /t 2 /nobreak >nul

:: Start React frontend
echo [3/3] Starting React frontend...
start "Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo   All services starting...
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:8000
echo   API Docs : http://localhost:8000/docs
echo ========================================
echo.
pause
