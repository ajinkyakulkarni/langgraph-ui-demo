#!/bin/bash

# LangGraph Workflow Application Setup Script

set -e  # Exit on error

echo "🚀 LangGraph Workflow Application Setup"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check prerequisites
echo -e "\n📋 Checking prerequisites..."

if ! command_exists python3; then
    print_error "Python 3 is not installed. Please install Python 3.8+"
    exit 1
else
    print_status "Python 3 found: $(python3 --version)"
fi

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 16+"
    exit 1
else
    print_status "Node.js found: $(node --version)"
fi

# PostgreSQL is now optional
if command_exists psql; then
    print_status "PostgreSQL client found (optional)"
else
    print_status "Using SQLite (no PostgreSQL required)"
fi

# Redis is now optional
if command_exists redis-cli; then
    print_status "Redis client found (optional)"
else
    print_status "Using in-memory cache (Redis not required)"
fi

# Backend Setup
echo -e "\n🔧 Setting up Backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    print_status "Virtual environment created"
else
    print_status "Virtual environment already exists"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip >/dev/null 2>&1

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt
print_status "Python dependencies installed"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    print_status ".env file created"
    print_warning "Please edit backend/.env with your configuration:"
    echo "  - DATABASE_URL (PostgreSQL connection string)"
    echo "  - REDIS_URL (Redis connection string)"
    echo "  - SECRET_KEY (Generate a secure secret key)"
    echo "  - OPENAI_API_KEY (Your OpenAI API key)"
else
    print_status ".env file already exists"
fi

# Database setup
echo -e "\n🗄️  Setting up database..."
# Check if using SQLite or PostgreSQL
if grep -q "sqlite" backend/.env 2>/dev/null || grep -q "sqlite" backend/.env.example 2>/dev/null; then
    print_status "Using SQLite database (no setup required)"
    echo "Database file will be created at: backend/langgraph_workflow.db"
else
    # PostgreSQL setup
    if command_exists psql; then
        DB_NAME="langgraph_workflow"
        if psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
            print_status "PostgreSQL database '$DB_NAME' already exists"
        else
            echo "Creating PostgreSQL database '$DB_NAME'..."
            createdb $DB_NAME 2>/dev/null || {
                print_warning "Could not create database. You may need to create it manually:"
                echo "  createdb $DB_NAME"
            }
        fi
    else
        print_warning "PostgreSQL not found. Make sure it's installed if you want to use it instead of SQLite"
    fi
fi

# Frontend Setup
echo -e "\n🎨 Setting up Frontend..."
cd ../frontend

# Install dependencies
echo "Installing Node.js dependencies..."
npm install
print_status "Node.js dependencies installed"

# Summary
echo -e "\n✅ Setup Complete!"
echo "=================="
echo -e "\n${GREEN}Next steps:${NC}"
echo "1. Edit backend/.env with your configuration (mainly add your OPENAI_API_KEY)"
echo "2. Run ./start.sh to start the application"
echo -e "\n${YELLOW}Optional:${NC}"
echo "- Run database migrations if using Alembic"
echo "- Configure additional agents in backend/app/agents/"

# Make start script executable
cd ..
if [ -f "start.sh" ]; then
    chmod +x start.sh
    print_status "Made start.sh executable"
fi

echo -e "\n🎉 Setup complete! Run ${GREEN}./start.sh${NC} to start the application."