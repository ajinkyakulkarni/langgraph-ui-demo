from fastapi import APIRouter, Depends
from typing import List, Dict, Any

from app.api.auth import get_current_user
from app.models import User

router = APIRouter()

@router.get("/types")
async def get_agent_types(current_user: User = Depends(get_current_user)):
    return [
        {
            "id": "planner",
            "name": "Planner Agent",
            "description": "Analyzes research questions and creates workflow plans",
            "category": "core"
        },
        {
            "id": "literature_search",
            "name": "Literature Search Agent",
            "description": "Searches academic papers and literature",
            "category": "research"
        },
        {
            "id": "code_search",
            "name": "Code Search Agent",
            "description": "Searches code repositories and documentation",
            "category": "research"
        },
        {
            "id": "summarizer",
            "name": "Summarizer Agent",
            "description": "Summarizes and synthesizes information",
            "category": "processing"
        },
        {
            "id": "pdf_generator",
            "name": "PDF Generator",
            "description": "Generates PDF reports from collected data",
            "category": "output"
        }
    ]

@router.get("/guardrails")
async def get_guardrail_types(current_user: User = Depends(get_current_user)):
    return [
        {
            "id": "content_filter",
            "name": "Content Filter",
            "description": "Filters inappropriate or irrelevant content"
        },
        {
            "id": "quality_check",
            "name": "Quality Check",
            "description": "Ensures output meets quality standards"
        },
        {
            "id": "format_validator",
            "name": "Format Validator",
            "description": "Validates data format and structure"
        }
    ]