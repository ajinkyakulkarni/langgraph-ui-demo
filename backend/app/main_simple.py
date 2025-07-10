from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.core.database import engine, Base
from app.api import workflow_ws

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="LangGraph Workflow API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(workflow_ws.router, prefix="/ws", tags=["websocket"])

@app.get("/")
async def root():
    return {"message": "LangGraph Workflow API"}

@app.get("/api/test")
async def test():
    return {"status": "ok", "message": "API is working"}

if __name__ == "__main__":
    uvicorn.run("app.main_simple:app", host="0.0.0.0", port=8000, reload=True)