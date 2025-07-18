from typing import TypedDict, Annotated, List, Dict, Any
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
import operator
import asyncio
import json
import os

from app.core.config import Settings

# Define the state
class ResearchState(TypedDict):
    question: str
    plan: Dict[str, Any]
    literature_results: List[Dict[str, Any]]
    code_results: List[Dict[str, Any]]
    summary: str
    messages: Annotated[List[str], operator.add]
    current_step: str

# Initialize LLM
# Create fresh settings instance to ensure we get latest env values
settings = Settings()
# Debug: Print the API key being used (first 10 chars only for security)
print(f"DEBUG: Direct env var OPENAI_API_KEY: {os.getenv('OPENAI_API_KEY', 'Not set')[:10]}...")
print(f"DEBUG: Settings OPENAI_API_KEY: {settings.OPENAI_API_KEY[:10] if settings.OPENAI_API_KEY else 'Not set'}...")
api_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
if api_key:
    print(f"DEBUG: Final API key starting with: {api_key[:10]}...")
    print(f"DEBUG: API key length: {len(api_key)}")
else:
    print("DEBUG: No API key found!")

llm = ChatOpenAI(
    temperature=0.7, 
    model="gpt-3.5-turbo",
    api_key=api_key
)

# Agent implementations
async def planner_agent(state: ResearchState) -> ResearchState:
    """Create a research plan based on the question"""
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a research planning assistant. Given a research question, 
        create a workflow plan. Output ONLY a valid JSON object with this structure:
        {{
          "steps": [
            {{
              "id": "step1",
              "agent": "literature_search",
              "description": "Search for academic papers on the topic",
              "query": "specific search query"
            }},
            {{
              "id": "step2", 
              "agent": "code_search",
              "description": "Find code implementations",
              "query": "code search query"
            }}
          ]
        }}
        Do not include any text before or after the JSON."""),
        ("human", "{question}")
    ])
    
    try:
        response = await llm.ainvoke(prompt.format(question=state["question"]))
        content = response.content.strip()
        
        print(f"Planner raw response: {content}")
        
        # Try to extract JSON from the response
        if '```json' in content:
            content = content.split('```json')[1].split('```')[0].strip()
        elif '```' in content:
            content = content.split('```')[1].split('```')[0].strip()
        
        plan = json.loads(content)
        
        # Validate plan structure
        if not isinstance(plan, dict) or 'steps' not in plan:
            raise ValueError("Invalid plan structure")
        
        return {
            "plan": plan,
            "messages": [f"Created research plan with {len(plan.get('steps', []))} steps"],
            "current_step": "planner"
        }
    except (json.JSONDecodeError, ValueError) as e:
        print(f"JSON parsing error in planner: {str(e)}")
        # Fallback plan if JSON parsing fails
        fallback_plan = {
            "steps": [
                {
                    "id": "step1",
                    "agent": "literature_search",
                    "description": "Search for information about the topic",
                    "query": state["question"]
                },
                {
                    "id": "step2",
                    "agent": "code_search", 
                    "description": "Find relevant code examples",
                    "query": state["question"]
                }
            ]
        }
        
        return {
            "plan": fallback_plan,
            "messages": [f"Created default research plan (JSON parse error: {str(e)})"],
            "current_step": "planner"
        }

async def literature_search_agent(state: ResearchState) -> ResearchState:
    """Search for academic literature"""
    # Get the literature search query from the plan
    lit_steps = [s for s in state["plan"]["steps"] if s["agent"] == "literature_search"]
    if not lit_steps:
        return {"messages": ["No literature search needed"], "current_step": "literature_search"}
    
    results = []
    for step in lit_steps:
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a literature search agent. Generate 3 relevant academic paper titles and summaries.
            Output ONLY a JSON array like this:
            [
              {{
                "title": "Paper Title",
                "authors": ["Author 1", "Author 2"],
                "summary": "Brief summary of the paper"
              }}
            ]"""),
            ("human", "Find papers about: {query}")
        ])
        
        try:
            response = await llm.ainvoke(prompt.format(query=step["query"]))
            content = response.content.strip()
            
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0].strip()
            elif '```' in content:
                content = content.split('```')[1].split('```')[0].strip()
                
            papers = json.loads(content)
            results.extend(papers)
        except:
            # Create mock papers if parsing fails
            results.extend([
                {
                    "title": f"Research on {step['query']}",
                    "authors": ["Research Team"],
                    "summary": f"A comprehensive study on {step['query']}"
                }
            ])
        
        # Simulate streaming updates
        await asyncio.sleep(0.5)
    
    return {
        "literature_results": results,
        "messages": [f"Found {len(results)} papers"],
        "current_step": "literature_search"
    }

async def code_search_agent(state: ResearchState) -> ResearchState:
    """Search for code examples"""
    code_steps = [s for s in state["plan"]["steps"] if s["agent"] == "code_search"]
    if not code_steps:
        return {"messages": ["No code search needed"], "current_step": "code_search"}
    
    results = []
    for step in code_steps:
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a code search agent. Generate 3 relevant code repositories or examples.
            Output ONLY a JSON array like this:
            [
              {{
                "name": "Repository Name",
                "description": "What this code does",
                "language": "Python",
                "url": "github.com/example"
              }}
            ]"""),
            ("human", "Find code examples for: {query}")
        ])
        
        try:
            response = await llm.ainvoke(prompt.format(query=step["query"]))
            content = response.content.strip()
            
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0].strip()
            elif '```' in content:
                content = content.split('```')[1].split('```')[0].strip()
                
            repos = json.loads(content)
            results.extend(repos)
        except:
            # Create mock repos if parsing fails
            results.extend([
                {
                    "name": f"Code for {step['query']}",
                    "description": f"Implementation example for {step['query']}",
                    "language": "Python",
                    "url": "github.com/example"
                }
            ])
        
        await asyncio.sleep(0.5)
    
    return {
        "code_results": results,
        "messages": [f"Found {len(results)} code repositories"],
        "current_step": "code_search"
    }

async def summarizer_agent(state: ResearchState) -> ResearchState:
    """Summarize all findings"""
    all_data = {
        "question": state["question"],
        "literature": state.get("literature_results", []),
        "code": state.get("code_results", [])
    }
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a research summarizer. Create a comprehensive summary of the research findings."),
        ("human", "Summarize these findings: {data}")
    ])
    
    response = await llm.ainvoke(prompt.format(data=json.dumps(all_data)))
    
    return {
        "summary": response.content,
        "messages": ["Research summary completed"],
        "current_step": "summarizer"
    }

# Build the graph
def create_research_graph():
    workflow = StateGraph(ResearchState)
    
    # Add nodes
    workflow.add_node("planner", planner_agent)
    workflow.add_node("literature_search", literature_search_agent)
    workflow.add_node("code_search", code_search_agent)
    workflow.add_node("summarizer", summarizer_agent)
    
    # Add edges
    workflow.set_entry_point("planner")
    workflow.add_edge("planner", "literature_search")
    workflow.add_edge("literature_search", "code_search")
    workflow.add_edge("code_search", "summarizer")
    workflow.add_edge("summarizer", END)
    
    # Add memory for time-travel
    memory = MemorySaver()
    
    return workflow.compile(checkpointer=memory)

# Create singleton instance
research_graph = create_research_graph()