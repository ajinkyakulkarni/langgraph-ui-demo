from typing import Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
import json

from app.models import Workflow, WorkflowExecution
from app.agents.planner import PlannerAgent
from app.agents.literature_search import LiteratureSearchAgent
from app.agents.code_search import CodeSearchAgent
from app.agents.summarizer import SummarizerAgent
from app.agents.pdf_generator import PDFGeneratorAgent
from app.agents.guardrails import GUARDRAIL_MAP
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

class WorkflowExecutor:
    def __init__(self, db: Session, connection_manager, client_id: str):
        self.db = db
        self.connection_manager = connection_manager
        self.client_id = client_id
        self.memory = MemorySaver()
        
        self.agent_map = {
            "planner": PlannerAgent,
            "literature_search": LiteratureSearchAgent,
            "code_search": CodeSearchAgent,
            "summarizer": SummarizerAgent,
            "pdf_generator": PDFGeneratorAgent
        }
    
    async def execute_workflow(self, workflow_id: int, input_data: Dict[str, Any]):
        workflow = self.db.query(Workflow).filter(Workflow.id == workflow_id).first()
        if not workflow:
            await self._send_update({"error": "Workflow not found"})
            return
        
        # Create execution record
        execution = WorkflowExecution(
            workflow_id=workflow_id,
            user_id=workflow.user_id,
            status="running",
            input_data=input_data,
            started_at=datetime.utcnow(),
            node_states={}
        )
        self.db.add(execution)
        self.db.commit()
        
        try:
            # Build LangGraph
            graph = self._build_graph(workflow)
            
            # Execute workflow
            config = {"configurable": {"thread_id": f"execution_{execution.id}"}}
            
            async for event in graph.astream(input_data, config=config):
                await self._handle_event(event, execution)
            
            # Mark as completed
            execution.status = "completed"
            execution.completed_at = datetime.utcnow()
            self.db.commit()
            
            await self._send_update({
                "status": "completed",
                "execution_id": execution.id
            })
            
        except Exception as e:
            execution.status = "failed"
            execution.output_data = {"error": str(e)}
            self.db.commit()
            
            await self._send_update({
                "status": "failed",
                "error": str(e)
            })
    
    def _build_graph(self, workflow) -> StateGraph:
        graph = Graph()
        
        # Add nodes
        for node in workflow.nodes:
            if node.type == "agent":
                agent_class = self.agent_map.get(node.data.get("agent"))
                if agent_class:
                    config = node.data.get("config", {})
                    
                    # Setup guardrails
                    input_guardrails = []
                    output_guardrails = []
                    
                    for guardrail_name in config.get("input_guardrails", []):
                        guardrail_class = GUARDRAIL_MAP.get(guardrail_name)
                        if guardrail_class:
                            guardrail = guardrail_class(config.get(f"{guardrail_name}_config", {}))
                            input_guardrails.append(guardrail)
                    
                    for guardrail_name in config.get("output_guardrails", []):
                        guardrail_class = GUARDRAIL_MAP.get(guardrail_name)
                        if guardrail_class:
                            guardrail = guardrail_class(config.get(f"{guardrail_name}_config", {}))
                            output_guardrails.append(guardrail)
                    
                    # Create agent with guardrails
                    agent = agent_class(config)
                    agent.input_guardrails = input_guardrails
                    agent.output_guardrails = output_guardrails
                    
                    graph.add_node(node.node_id, agent.process)
        
        # Add edges
        for edge in workflow.edges:
            if edge.target == "end":
                graph.add_edge(edge.source, END)
            else:
                graph.add_edge(edge.source, edge.target)
        
        # Set entry point
        start_node = next((n for n in workflow.nodes if n.type == "start"), None)
        if start_node:
            first_edge = next((e for e in workflow.edges if e.source == start_node.node_id), None)
            if first_edge:
                graph.set_entry_point(first_edge.target)
        
        return graph.compile(checkpointer=self.memory)
    
    async def _handle_event(self, event: Dict[str, Any], execution: WorkflowExecution):
        # Update node states
        for node_id, node_data in event.items():
            if isinstance(node_data, dict):
                execution.node_states[node_id] = node_data
                
                # Send real-time update
                await self._send_update({
                    "type": "node_update",
                    "node_id": node_id,
                    "data": node_data
                })
        
        self.db.commit()
    
    async def _send_update(self, message: Dict[str, Any]):
        await self.connection_manager.send_message(message, self.client_id)
    
    async def update_and_rerun_node(self, workflow_id: int, node_id: str, new_params: Dict[str, Any]):
        # Get the latest execution
        execution = self.db.query(WorkflowExecution).filter(
            WorkflowExecution.workflow_id == workflow_id
        ).order_by(WorkflowExecution.created_at.desc()).first()
        
        if not execution:
            await self._send_update({"error": "No execution found"})
            return
        
        # Get workflow
        workflow = self.db.query(Workflow).filter(Workflow.id == workflow_id).first()
        if not workflow:
            await self._send_update({"error": "Workflow not found"})
            return
        
        try:
            # Build graph
            graph = self._build_graph(workflow)
            
            # Get the checkpoint from the previous execution
            config = {"configurable": {"thread_id": f"execution_{execution.id}"}}
            
            # Get current state
            state = graph.get_state(config)
            
            # Update node parameters
            node_states = execution.node_states or {}
            if node_id in node_states:
                node_states[node_id].update(new_params)
            
            # Resume from the updated node
            await self._send_update({
                "status": "rerunning",
                "node_id": node_id,
                "message": f"Re-running from node {node_id}"
            })
            
            # Re-execute from this node forward
            async for event in graph.astream(None, config=config, stream_mode="updates"):
                await self._handle_event(event, execution)
            
            execution.status = "completed"
            execution.completed_at = datetime.utcnow()
            self.db.commit()
            
            await self._send_update({
                "status": "completed",
                "message": "Re-run completed successfully"
            })
            
        except Exception as e:
            await self._send_update({
                "status": "error",
                "error": str(e)
            })