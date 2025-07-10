from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Workflow(Base):
    __tablename__ = "workflows"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id"))
    is_public = Column(Boolean, default=False)
    forked_from = Column(Integer, ForeignKey("workflows.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", backref="workflows")
    nodes = relationship("WorkflowNode", back_populates="workflow", cascade="all, delete-orphan")
    edges = relationship("WorkflowEdge", back_populates="workflow", cascade="all, delete-orphan")
    executions = relationship("WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan")

class WorkflowNode(Base):
    __tablename__ = "workflow_nodes"
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"))
    node_id = Column(String, nullable=False)
    type = Column(String, nullable=False)  # 'agent', 'tool', 'start', 'end'
    position = Column(JSON)  # {x: number, y: number}
    data = Column(JSON)  # Node configuration
    
    workflow = relationship("Workflow", back_populates="nodes")

class WorkflowEdge(Base):
    __tablename__ = "workflow_edges"
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"))
    source = Column(String, nullable=False)
    target = Column(String, nullable=False)
    
    workflow = relationship("Workflow", back_populates="edges")

class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="pending")  # pending, running, completed, failed
    input_data = Column(JSON)
    output_data = Column(JSON)
    node_states = Column(JSON)  # Track state of each node
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    workflow = relationship("Workflow", back_populates="executions")
    user = relationship("User")