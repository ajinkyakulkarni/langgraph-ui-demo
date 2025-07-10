# LangGraph Workflow Application

A visual workflow builder with LangGraph integration for research automation.

## Features
- Visual workflow builder with ReactFlow
- Chat interface for research questions
- Multiple agent types (literature search, code search)
- Input/output guardrails
- Workflow persistence and sharing
- PDF export
- Real-time streaming of agent outputs

## Architecture
- Frontend: Next.js + TypeScript + ReactFlow
- Backend: FastAPI + LangGraph + SQLite (PostgreSQL optional)
- Authentication: JWT-based auth

## Prerequisites

- Python 3.8+
- Node.js 16+
- OpenAI API Key

Optional (for production):
- Redis (for caching)
- PostgreSQL (instead of SQLite)

## Quick Start

### Backend Setup

1. **Navigate to the backend directory:**
```bash
cd backend
```

2. **Activate the virtual environment:**
```bash
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

4. **Create a `.env` file:**
```bash
cp .env.example .env
```

5. **Edit the `.env` file with your configuration:**
```
DATABASE_URL=sqlite:///./langgraph_workflow.db
REDIS_URL=none
SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key
```

Note: 
- The application uses SQLite by default (no database server required)
- Redis is optional (uses in-memory cache when REDIS_URL=none)
- For production, you can use PostgreSQL and Redis by updating the URLs

6. **Start the backend server:**
```bash
python -m app.main
```

The backend will run on `http://localhost:8000`

### Frontend Setup

1. **Open a new terminal and navigate to frontend:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the frontend:**
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage

1. Open your browser to `http://localhost:3000`
2. Create a new account or login
3. Click "New Workflow" to create a workflow
4. Add agents by clicking the buttons in the canvas
5. Connect nodes by dragging from outputs to inputs
6. Type your research question in the chat interface
7. Watch real-time execution and download the PDF report

## Available Agents

- **Planner Agent**: Analyzes research questions and creates workflow plans
- **Literature Search Agent**: Searches academic papers via arXiv
- **Code Search Agent**: Searches code repositories
- **Summarizer Agent**: Synthesizes information from multiple sources
- **PDF Generator**: Creates PDF reports from collected data

## Troubleshooting

### Redis not running:
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis
```

### Port already in use:
- Backend: Change port in `app/main.py`
- Frontend: Use `npm run dev -- -p 3001`

## Development

See [SETUP.md](./SETUP.md) for detailed setup instructions and development guide.