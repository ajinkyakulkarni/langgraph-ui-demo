from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
import json
import asyncio
from typing import Dict

from app.core.database import get_db
from app.services.workflow_executor import WorkflowExecutor

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
    
    def disconnect(self, client_id: str):
        self.active_connections.pop(client_id, None)
    
    async def send_message(self, message: dict, client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(message)

manager = ConnectionManager()

@router.websocket("/workflow/{workflow_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    workflow_id: int,
    db: Session = Depends(get_db)
):
    client_id = f"client_{id(websocket)}"
    await manager.connect(websocket, client_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "execute":
                executor = WorkflowExecutor(db, manager, client_id)
                asyncio.create_task(
                    executor.execute_workflow(workflow_id, data.get("input_data", {}))
                )
            
            elif data["type"] == "update_node":
                executor = WorkflowExecutor(db, manager, client_id)
                asyncio.create_task(
                    executor.update_and_rerun_node(
                        workflow_id,
                        data["node_id"],
                        data["new_params"]
                    )
                )
    
    except WebSocketDisconnect:
        manager.disconnect(client_id)