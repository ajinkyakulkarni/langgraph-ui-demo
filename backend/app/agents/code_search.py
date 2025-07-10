from typing import Dict, Any, AsyncIterator
import httpx
from app.agents.base import BaseAgent

class CodeSearchAgent(BaseAgent):
    async def process(self, input_data: Any) -> AsyncIterator[Dict[str, Any]]:
        query = input_data.get("query", "")
        language = input_data.get("language", "")
        
        yield {"status": "searching", "message": f"Searching code for: {query}"}
        
        # GitHub code search (simplified - in production use proper API)
        async with httpx.AsyncClient() as client:
            headers = {"Accept": "application/vnd.github.v3+json"}
            
            params = {
                "q": f"{query} language:{language}" if language else query,
                "per_page": 10
            }
            
            response = await client.get(
                "https://api.github.com/search/code",
                headers=headers,
                params=params
            )
            
            if response.status_code == 200:
                data = response.json()
                
                results = []
                for item in data.get("items", []):
                    result = {
                        "repository": item["repository"]["full_name"],
                        "file_path": item["path"],
                        "url": item["html_url"],
                        "score": item["score"]
                    }
                    results.append(result)
                    
                    yield {
                        "status": "found_code",
                        "result": result,
                        "message": f"Found in: {result['repository']}"
                    }
                
                yield {
                    "status": "completed",
                    "results": results,
                    "count": len(results),
                    "message": f"Found {len(results)} code results"
                }
            else:
                yield {
                    "status": "error",
                    "message": "Failed to search code"
                }