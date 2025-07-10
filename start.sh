#!/bin/bash

# LangGraph Workflow Application Start Script

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default ports
BACKEND_PORT=8000
FRONTEND_PORT=3000

# Function to check if port is in use
is_port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to find available port
find_available_port() {
    local port=$1
    while is_port_in_use $port; do
        echo -e "${YELLOW}Port $port is in use, trying $((port + 1))...${NC}"
        port=$((port + 1))
    done
    echo $port
}

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    
    # Kill backend process
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✓${NC} Backend stopped"
    fi
    
    # Kill frontend process
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✓${NC} Frontend stopped"
    fi
    
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

echo -e "${BLUE}🚀 Starting LangGraph Workflow Application${NC}"
echo "========================================"

# Check if setup has been run
if [ ! -d "backend/venv" ] || [ ! -d "frontend/node_modules" ]; then
    echo -e "${RED}✗${NC} Setup has not been completed. Please run ./setup.sh first"
    exit 1
fi

# Find available ports
BACKEND_PORT=$(find_available_port $BACKEND_PORT)
FRONTEND_PORT=$(find_available_port $FRONTEND_PORT)

echo -e "${GREEN}✓${NC} Backend will run on port: $BACKEND_PORT"
echo -e "${GREEN}✓${NC} Frontend will run on port: $FRONTEND_PORT"

# Create temporary directory for logs
LOG_DIR="/tmp/langgraph-workflow-logs"
mkdir -p $LOG_DIR

# Start Backend
echo -e "\n${BLUE}Starting Backend...${NC}"
cd backend

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}✗${NC} .env file not found in backend directory"
    echo "Please create backend/.env with your configuration"
    exit 1
fi

# Activate virtual environment and start backend
source venv/bin/activate

# Create a temporary Python script to run with custom port
cat > temp_main.py << EOF
import uvicorn
from app.main import app

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=$BACKEND_PORT, reload=True)
EOF

python temp_main.py > $LOG_DIR/backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo -n "Waiting for backend to start"
for i in {1..30}; do
    if curl -s http://localhost:$BACKEND_PORT > /dev/null; then
        echo -e "\n${GREEN}✓${NC} Backend started successfully"
        break
    fi
    echo -n "."
    sleep 1
done

if ! curl -s http://localhost:$BACKEND_PORT > /dev/null; then
    echo -e "\n${RED}✗${NC} Backend failed to start. Check logs at $LOG_DIR/backend.log"
    cat $LOG_DIR/backend.log
    exit 1
fi

# Clean up temporary file
rm -f temp_main.py

# Start Frontend
echo -e "\n${BLUE}Starting Frontend...${NC}"
cd ../frontend

# Update next.config.js to use the correct backend port
cat > next.config.js << EOF
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:$BACKEND_PORT/api/:path*',
      },
      {
        source: '/ws/:path*',
        destination: 'http://localhost:$BACKEND_PORT/ws/:path*',
      },
    ]
  },
}

module.exports = nextConfig
EOF

# Start frontend
PORT=$FRONTEND_PORT npm run dev > $LOG_DIR/frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
echo -n "Waiting for frontend to start"
for i in {1..30}; do
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null; then
        echo -e "\n${GREEN}✓${NC} Frontend started successfully"
        break
    fi
    echo -n "."
    sleep 1
done

if ! curl -s http://localhost:$FRONTEND_PORT > /dev/null; then
    echo -e "\n${RED}✗${NC} Frontend failed to start. Check logs at $LOG_DIR/frontend.log"
    cat $LOG_DIR/frontend.log
    exit 1
fi

# Success message
echo -e "\n${GREEN}✅ Application is running!${NC}"
echo "========================="
echo -e "${BLUE}Backend:${NC}  http://localhost:$BACKEND_PORT"
echo -e "${BLUE}Frontend:${NC} http://localhost:$FRONTEND_PORT"
echo -e "\n${YELLOW}Logs:${NC}"
echo "Backend:  $LOG_DIR/backend.log"
echo "Frontend: $LOG_DIR/frontend.log"
echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}"

# Keep the script running
while true; do
    sleep 1
done