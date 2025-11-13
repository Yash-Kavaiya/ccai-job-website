@echo off
REM CCAI Jobs Backend - Quick Start Script (Windows)

echo 🚀 Starting CCAI Jobs Backend...

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔌 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install/update dependencies
echo 📚 Installing dependencies...
pip install --upgrade pip
pip install -r requirements.txt

REM Check if .env exists
if not exist ".env" (
    echo ⚠️  .env file not found. Copying from .env.example...
    copy .env.example .env
    echo ⚠️  Please edit .env and add your API keys before running the server!
    pause
    exit /b 1
)

REM Create database directory if it doesn't exist
if not exist "database" mkdir database

REM Run migrations
echo 🗄️  Running database migrations...
alembic upgrade head

REM Start server
echo ✅ Starting FastAPI server...
echo 📖 API Documentation: http://localhost:8000/docs
echo 🔗 API URL: http://localhost:8000
echo.
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
