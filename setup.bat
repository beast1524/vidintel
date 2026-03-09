@echo off
echo ========================================
echo   VidIntel - First Time Setup
echo ========================================
echo.

:: ── Backend setup ──────────────────────────────────
echo [Backend] Creating virtual environment...
cd backend
python -m venv venv
call venv\Scripts\activate.bat

echo [Backend] Installing Python dependencies...
pip install --upgrade pip --quiet
pip install -r requirements.txt
call venv\Scripts\deactivate.bat
cd ..

:: ── Frontend setup ─────────────────────────────────
echo.
echo [Frontend] Installing Node dependencies...
cd frontend
npm install
cd ..

echo.
echo ========================================
echo   Setup complete!
echo   Run start.bat to launch the app.
echo ========================================
pause
