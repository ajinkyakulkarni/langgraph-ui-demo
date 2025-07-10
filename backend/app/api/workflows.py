from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, Workflow, WorkflowNode, WorkflowEdge
from app.schemas.workflow import WorkflowCreate, WorkflowResponse

router = APIRouter()

@router.post("/", response_model=WorkflowResponse)
async def create_workflow(
    workflow: WorkflowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_workflow = Workflow(
        name=workflow.name,
        description=workflow.description,
        user_id=current_user.id,
        is_public=workflow.is_public
    )
    db.add(db_workflow)
    db.flush()
    
    for node in workflow.nodes:
        db_node = WorkflowNode(
            workflow_id=db_workflow.id,
            node_id=node.node_id,
            type=node.type,
            position=node.position,
            data=node.data
        )
        db.add(db_node)
    
    for edge in workflow.edges:
        db_edge = WorkflowEdge(
            workflow_id=db_workflow.id,
            source=edge.source,
            target=edge.target
        )
        db.add(db_edge)
    
    db.commit()
    db.refresh(db_workflow)
    
    return db_workflow

@router.get("/", response_model=List[WorkflowResponse])
async def get_workflows(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    include_public: bool = False
):
    query = db.query(Workflow)
    
    if include_public:
        query = query.filter(
            (Workflow.user_id == current_user.id) | (Workflow.is_public == True)
        )
    else:
        query = query.filter(Workflow.user_id == current_user.id)
    
    workflows = query.all()
    return workflows

@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    if workflow.user_id != current_user.id and not workflow.is_public:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return workflow

@router.post("/{workflow_id}/fork", response_model=WorkflowResponse)
async def fork_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    original = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    
    if not original:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    if not original.is_public and original.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot fork private workflow")
    
    forked = Workflow(
        name=f"{original.name} (Fork)",
        description=original.description,
        user_id=current_user.id,
        is_public=False,
        forked_from=original.id
    )
    db.add(forked)
    db.flush()
    
    for node in original.nodes:
        new_node = WorkflowNode(
            workflow_id=forked.id,
            node_id=node.node_id,
            type=node.type,
            position=node.position,
            data=node.data
        )
        db.add(new_node)
    
    for edge in original.edges:
        new_edge = WorkflowEdge(
            workflow_id=forked.id,
            source=edge.source,
            target=edge.target
        )
        db.add(new_edge)
    
    db.commit()
    db.refresh(forked)
    
    return forked