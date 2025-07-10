# LangGraph Workflow Application Setup Guide

## Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL
- Redis
- OpenAI API Key

## Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Activate virtual environment:
```bash
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration:
# - DATABASE_URL
# - REDIS_URL
# - SECRET_KEY
# - OPENAI_API_KEY
```

5. Set up PostgreSQL database:
```bash
createdb langgraph_workflow
```

6. Run database migrations:
```bash
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

7. Start the backend server:
```bash
python -m app.main
```

The backend will run on http://localhost:8000

## Frontend Setup

1. Navigate to frontend directory:
```bash
cd ../frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on http://localhost:3000

## Features Overview

### 1. Authentication
- User registration and login
- JWT-based authentication
- Session management

### 2. Workflow Builder
- Visual workflow creation with ReactFlow
- Drag-and-drop interface
- Real-time node status updates

### 3. Agent Types
- **Planner Agent**: Analyzes research questions and creates workflow plans
- **Literature Search Agent**: Searches academic papers via arXiv
- **Code Search Agent**: Searches code repositories
- **Summarizer Agent**: Synthesizes information from multiple sources
- **PDF Generator**: Creates PDF reports from collected data

### 4. Guardrails
- **Content Filter**: Filters inappropriate content
- **Quality Check**: Ensures output quality standards
- **Format Validator**: Validates data formats

### 5. Advanced Features
- Workflow persistence and retrieval
- Workflow sharing and forking
- Node re-run with parameter updates
- Real-time streaming via WebSocket
- LangGraph memory and checkpointing

## Usage

1. **Create Account**: Register a new account or login
2. **Create Workflow**: Click "New Workflow" in the sidebar
3. **Add Nodes**: Drag agents from the toolbar onto the canvas
4. **Connect Nodes**: Draw edges between nodes to define flow
5. **Configure Nodes**: Click nodes to set parameters and guardrails
6. **Run Workflow**: Type research question in chat interface
7. **Monitor Progress**: Watch real-time updates in nodes and chat
8. **Download Results**: Get PDF report when workflow completes

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/token` - Login
- `GET /api/auth/me` - Get current user

### Workflows
- `GET /api/workflows` - List workflows
- `POST /api/workflows` - Create workflow
- `GET /api/workflows/{id}` - Get workflow
- `POST /api/workflows/{id}/fork` - Fork workflow

### Agents
- `GET /api/agents/types` - List agent types
- `GET /api/agents/guardrails` - List guardrail types

### WebSocket
- `WS /ws/workflow/{id}` - Real-time workflow execution

## Development

### Adding New Agents

1. Create agent class in `backend/app/agents/`:
```python
from app.agents.base import BaseAgent

class MyAgent(BaseAgent):
    async def process(self, input_data):
        # Implementation
        yield {"status": "completed", "result": data}
```

2. Register in workflow executor:
```python
self.agent_map["my_agent"] = MyAgent
```

3. Add to agent types API response

### Adding New Guardrails

1. Create guardrail class in `backend/app/agents/guardrails.py`:
```python
class MyGuardrail(BaseGuardrail):
    async def validate(self, data):
        # Validation logic
        return data
```

2. Register in GUARDRAIL_MAP

## Troubleshooting

### Backend Issues
- Check PostgreSQL and Redis are running
- Verify OpenAI API key is set
- Check Python dependencies are installed

### Frontend Issues
- Clear browser cache
- Check WebSocket connection
- Verify API proxy configuration in next.config.js

### Database Issues
- Run migrations: `alembic upgrade head`
- Reset database: `alembic downgrade base && alembic upgrade head`