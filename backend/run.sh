#!/bin/bash

# CCAI Jobs Backend - Quick Start Script

set -e

echo "🚀 Starting CCAI Jobs Backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📚 Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your API keys before running the server!"
    exit 1
fi

# Create database directory if it doesn't exist
mkdir -p database

# Run migrations
echo "🗄️  Running database migrations..."
alembic upgrade head

# Start server
echo "✅ Starting FastAPI server..."
echo "📖 API Documentation: http://localhost:8000/docs"
echo "🔗 API URL: http://localhost:8000"
echo ""
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
