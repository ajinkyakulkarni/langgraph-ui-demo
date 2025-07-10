from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class NodeCreate(BaseModel):
    node_id: str
    type: str
    position: Dict[str, float]
    data: Dict[str, Any]

class EdgeCreate(BaseModel):
    source: str
    target: str

class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False
    nodes: List[NodeCreate]
    edges: List[EdgeCreate]

class WorkflowResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    user_id: int
    is_public: bool
    created_at: datetime
    updated_at: Optional[datetime]
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    
    class Config:
        from_attributes = True

class WorkflowExecutionCreate(BaseModel):
    workflow_id: int
    input_data: Dict[str, Any]

class WorkflowExecutionResponse(BaseModel):
    id: int
    workflow_id: int
    status: str
    input_data: Dict[str, Any]
    output_data: Optional[Dict[str, Any]]
    node_states: Optional[Dict[str, Any]]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True