from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Any
import json
import uuid
from datetime import datetime

from app.workflows.research_graph import research_graph, ResearchState

router = APIRouter()

# Store active sessions
active_sessions: Dict[str, Dict[str, Any]] = {}

@router.websocket("/workflow")
async def workflow_websocket(websocket: WebSocket):
    await websocket.accept()
    session_id = str(uuid.uuid4())
    thread_id = f"research_{session_id}"
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "execute":
                # Start new execution
                config = {"configurable": {"thread_id": thread_id}}
                
                # Send initial state
                await websocket.send_json({
                    "type": "execution_started",
                    "thread_id": thread_id,
                    "timestamp": datetime.now().isoformat()
                })
                
                # Execute workflow with streaming
                initial_state: ResearchState = {
                    "question": data["question"],
                    "plan": {},
                    "literature_results": [],
                    "code_results": [],
                    "summary": "",
                    "messages": [],
                    "current_step": ""
                }
                
                async for event in research_graph.astream(initial_state, config):
                    # Send each step update
                    for node, state_update in event.items():
                        await websocket.send_json({
                            "type": "node_update",
                            "node": node,
                            "state": state_update,
                            "timestamp": datetime.now().isoformat()
                        })
                
                # Send completion
                await websocket.send_json({
                    "type": "execution_completed",
                    "thread_id": thread_id,
                    "timestamp": datetime.now().isoformat()
                })
            
            elif data["type"] == "get_history":
                # Get execution history for time-travel
                history = research_graph.get_state_history(
                    {"configurable": {"thread_id": thread_id}}
                )
                
                states = []
                for state in history:
                    states.append({
                        "state": state.values,
                        "step": state.metadata.get("step", 0),
                        "timestamp": state.metadata.get("timestamp", "")
                    })
                
                await websocket.send_json({
                    "type": "history",
                    "states": states
                })
            
            elif data["type"] == "rewind":
                # Rewind to a specific state
                target_step = data["step"]
                config = {"configurable": {"thread_id": thread_id}}
                
                # Get the state at the target step
                history = list(research_graph.get_state_history(config))
                if target_step < len(history):
                    target_state = history[-(target_step + 1)]
                    
                    # Update to that state
                    await research_graph.aupdate_state(
                        config,
                        target_state.values
                    )
                    
                    await websocket.send_json({
                        "type": "rewound",
                        "step": target_step,
                        "state": target_state.values
                    })
            
            elif data["type"] == "update_and_continue":
                # Update a node's state and continue execution
                config = {"configurable": {"thread_id": thread_id}}
                node_updates = data.get("updates", {})
                
                # Update the state
                await research_graph.aupdate_state(config, node_updates)
                
                # Continue execution from current state
                current_state = await research_graph.aget_state(config)
                
                async for event in research_graph.astream(None, config):
                    for node, state_update in event.items():
                        await websocket.send_json({
                            "type": "node_update",
                            "node": node,
                            "state": state_update,
                            "timestamp": datetime.now().isoformat()
                        })
                
            elif data["type"] == "get_state":
                # Get current state
                config = {"configurable": {"thread_id": thread_id}}
                state = await research_graph.aget_state(config)
                
                await websocket.send_json({
                    "type": "current_state",
                    "state": state.values,
                    "next": state.next
                })
    
    except WebSocketDisconnect:
        # Clean up session
        if session_id in active_sessions:
            del active_sessions[session_id]
        print(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
        import traceback
        traceback.print_exc()
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass
        await websocket.close()