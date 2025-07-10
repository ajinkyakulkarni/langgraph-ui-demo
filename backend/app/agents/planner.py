from typing import Dict, Any, AsyncIterator
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, END

from app.agents.base import BaseAgent

class PlannerAgent(BaseAgent):
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.llm = ChatOpenAI(temperature=0, model="gpt-4")
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a research planning assistant. Given a research question, 
            create a workflow plan that breaks down the task into steps. Each step should 
            specify which agent to use (literature_search, code_search, summarizer, etc.).
            
            Output a structured plan with:
            1. Steps in sequence
            2. Agent type for each step
            3. Expected inputs/outputs
            4. Dependencies between steps"""),
            ("human", "{question}")
        ])
    
    async def process(self, input_data: Any) -> AsyncIterator[Dict[str, Any]]:
        yield {"status": "starting", "message": "Analyzing research question..."}
        
        question = input_data.get("question", "")
        
        chain = self.prompt | self.llm
        response = await chain.ainvoke({"question": question})
        
        yield {"status": "planning", "message": "Creating workflow plan..."}
        
        plan = self._parse_plan(response.content)
        
        workflow_graph = self._create_workflow_graph(plan)
        
        yield {
            "status": "completed",
            "plan": plan,
            "graph": workflow_graph,
            "message": "Workflow plan created successfully"
        }
    
    def _parse_plan(self, llm_output: str) -> Dict[str, Any]:
        # Parse LLM output into structured plan
        # This is simplified - in production, use proper parsing
        return {
            "steps": [
                {
                    "id": "step1",
                    "agent": "literature_search",
                    "description": "Search for relevant papers",
                    "inputs": ["research_question"],
                    "outputs": ["papers"]
                },
                {
                    "id": "step2",
                    "agent": "summarizer",
                    "description": "Summarize findings",
                    "inputs": ["papers"],
                    "outputs": ["summary"]
                }
            ]
        }
    
    def _create_workflow_graph(self, plan: Dict[str, Any]) -> Dict[str, Any]:
        # Create visual graph representation
        nodes = []
        edges = []
        
        # Add start node
        nodes.append({
            "id": "start",
            "type": "start",
            "position": {"x": 100, "y": 100},
            "data": {"label": "Start"}
        })
        
        # Add agent nodes
        y_position = 200
        prev_node = "start"
        
        for i, step in enumerate(plan["steps"]):
            node_id = f"node_{i}"
            nodes.append({
                "id": node_id,
                "type": "agent",
                "position": {"x": 100, "y": y_position},
                "data": {
                    "label": step["description"],
                    "agent": step["agent"],
                    "inputs": step["inputs"],
                    "outputs": step["outputs"]
                }
            })
            
            edges.append({
                "id": f"edge_{i}",
                "source": prev_node,
                "target": node_id
            })
            
            prev_node = node_id
            y_position += 100
        
        # Add end node
        nodes.append({
            "id": "end",
            "type": "end",
            "position": {"x": 100, "y": y_position},
            "data": {"label": "End"}
        })
        
        edges.append({
            "id": f"edge_end",
            "source": prev_node,
            "target": "end"
        })
        
        return {"nodes": nodes, "edges": edges}