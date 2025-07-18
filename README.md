# LangGraph Workflow Application

A visual workflow builder powered by LangGraph for intelligent research automation. Build, visualize, and execute complex AI agent workflows through an intuitive drag-and-drop interface.

![LangGraph Workflow Builder](docs/images/workflow-demo.png)

## 🚀 Features

### Core Functionality
- **Visual Workflow Builder**: Intuitive drag-and-drop interface using ReactFlow
- **Real-time Chat Interface**: Interactive research assistant with streaming responses
- **Multi-Agent System**: Coordinated AI agents for comprehensive research
- **Live Execution Visualization**: Watch your workflow execute in real-time
- **Interactive MiniMap**: Navigate large workflows easily
- **Time Travel Debugging**: Rewind and replay workflow states

### Agent Types
- **🧠 Planner Agent**: Analyzes research questions and creates execution plans
- **📚 Literature Search Agent**: Searches academic papers via arXiv API
- **💻 Code Search Agent**: Finds relevant code implementations
- **📊 Summarizer Agent**: Synthesizes information from multiple sources
- **📄 PDF Generator**: Creates formatted PDF reports
- **🛡️ Guardrails Agent**: Validates inputs and outputs

### Technical Features
- **WebSocket Communication**: Real-time bidirectional updates
- **State Persistence**: Save and reload workflows
- **Flexible Authentication**: JWT-based auth (can be disabled for demos)
- **Configurable Storage**: SQLite for development, PostgreSQL for production
- **Optional Caching**: Redis integration for improved performance

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Next.js + TS   │────▶│  FastAPI        │────▶│  LangGraph      │
│  Frontend       │◀────│  Backend        │◀────│  Agents         │
│                 │ WS  │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  ReactFlow      │     │  SQLite/        │     │  OpenAI API     │
│  Workflow UI    │     │  PostgreSQL     │     │  LLM Backend    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 📋 Prerequisites

- **Python 3.8+** (3.10+ recommended)
- **Node.js 16+** (18+ recommended)
- **OpenAI API Key** (required for AI agents)

### Optional (for production)
- **Redis** - For caching and performance optimization
- **PostgreSQL** - For production database (SQLite works fine for development)

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/langgraph-workflow-app.git
cd langgraph-workflow-app

# Run the setup script
chmod +x setup.sh
./setup.sh

# Create your .env file
cd backend
cp .env.example .env
# Edit .env with your OpenAI API key

# Start both services
cd ..
./start.sh
```

### Option 2: Manual Setup

#### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Run the backend
# Option 1: Simple mode (no authentication) - recommended for demos
python -m uvicorn app.main_simple:app --reload

# Option 2: Full mode (with authentication) - for production
python -m uvicorn app.main:app --reload
```

#### Frontend Setup

```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

## 🎯 Backend Modes

The application provides two backend modes:

### 1. **Simple Mode** (`main_simple.py`)
- **No authentication required** - WebSocket connects directly
- **Best for**: Demos, development, testing
- **WebSocket endpoint**: `/ws/workflow`
- **Start with**: `python -m uvicorn app.main_simple:app --reload`

### 2. **Full Mode** (`main.py`)
- **JWT authentication** - Secure user management
- **Best for**: Production deployments
- **WebSocket endpoint**: `/ws/workflow/{workflow_id}` (requires auth token)
- **Additional features**: User accounts, workflow persistence, access control
- **Start with**: `python -m uvicorn app.main:app --reload`

> **Note**: The `start.sh` script uses Simple Mode by default for easy demos.

## 🔧 Configuration

### Backend Configuration (.env)

```env
# Database (SQLite by default, PostgreSQL for production)
DATABASE_URL=sqlite:///./langgraph_workflow.db
# DATABASE_URL=postgresql://user:password@localhost/dbname

# Redis (optional - uses in-memory cache if not available)
REDIS_URL=none
# REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-secret-key-here

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Optional: Additional LLM providers
# ANTHROPIC_API_KEY=your-anthropic-key
# COHERE_API_KEY=your-cohere-key
```

### Frontend Configuration

The frontend automatically connects to the backend on `http://localhost:8000`. To change this, modify `next.config.js`.

## 📖 Usage Guide

### Creating a Workflow

1. **Access the Application**: Open `http://localhost:3000` in your browser
2. **Create/Select a Workflow**: Use the left sidebar to create or select a workflow
3. **Add Agents**: Click agent buttons to add them to the canvas
4. **Connect Nodes**: Drag from output to input ports to create connections
5. **Configure Agents**: Click on nodes to set parameters and guardrails

### Executing Research

1. **Enter Research Question**: Type your question in the chat interface
2. **Watch Execution**: See real-time updates as agents process your request
3. **View Results**: Results appear in the chat with formatted responses
4. **Export PDF**: Download a comprehensive PDF report of findings

### Advanced Features

- **MiniMap Navigation**: Click or drag on the minimap to navigate large workflows
- **Time Travel**: Use the time travel feature to replay workflow execution
- **Parameter Editing**: Double-click nodes to edit agent parameters
- **Workflow Templates**: Save and reuse workflow configurations

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Install development dependencies
cd backend
pip install -r requirements-dev.txt

cd ../frontend
npm install --save-dev

# Run tests
cd backend
pytest

cd ../frontend
npm test
```

### Code Style

- **Python**: Black formatter, flake8 linting
- **TypeScript**: ESLint with Prettier
- **Commits**: Conventional commits format

## 🐛 Troubleshooting

### Common Issues

#### WebSocket Connection Failed
- Ensure both frontend and backend are running
- Check that ports 3000 and 8000 are not in use
- For production, ensure WebSocket proxy is configured

#### OpenAI API Errors
- Verify your API key is set correctly in `.env`
- Check your OpenAI account has sufficient credits
- Ensure you're not hitting rate limits

#### Database Issues
- For SQLite: Ensure write permissions in backend directory
- For PostgreSQL: Verify connection string and database exists

### Debug Mode

Enable debug logging:
```bash
# Backend
export DEBUG=true
python -m uvicorn app.main:app --log-level debug

# Frontend
export NEXT_PUBLIC_DEBUG=true
npm run dev
```

## 📚 API Documentation

- **Backend API**: `http://localhost:8000/docs` (Swagger UI)
- **WebSocket Events**: See [docs/websocket-api.md](docs/websocket-api.md)
- **Agent Specifications**: See [docs/agents.md](docs/agents.md)

## 🔒 Security Considerations

- **API Keys**: Never commit `.env` files with real API keys
- **Authentication**: Enable JWT auth for production deployments
- **CORS**: Configure allowed origins for production
- **Rate Limiting**: Implement rate limiting for public deployments

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [LangGraph](https://github.com/langchain-ai/langgraph) - Multi-agent orchestration framework
- [ReactFlow](https://reactflow.dev/) - React library for building flow-based UIs
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Next.js](https://nextjs.org/) - React framework for production

## 📮 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/langgraph-workflow-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/langgraph-workflow-app/discussions)
- **Email**: support@yourproject.com

---

Built with ❤️ by the LangGraph Workflow Team