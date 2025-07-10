from typing import Dict, Any, AsyncIterator
import arxiv
import asyncio
from app.agents.base import BaseAgent

class LiteratureSearchAgent(BaseAgent):
    async def process(self, input_data: Any) -> AsyncIterator[Dict[str, Any]]:
        query = input_data.get("query", "")
        max_results = input_data.get("max_results", 10)
        
        yield {"status": "searching", "message": f"Searching for papers on: {query}"}
        
        # Search arxiv
        search = arxiv.Search(
            query=query,
            max_results=max_results,
            sort_by=arxiv.SortCriterion.Relevance
        )
        
        papers = []
        async for result in self._async_search(search):
            paper_info = {
                "title": result.title,
                "authors": [author.name for author in result.authors],
                "summary": result.summary,
                "published": result.published.isoformat(),
                "pdf_url": result.pdf_url,
                "arxiv_id": result.entry_id
            }
            papers.append(paper_info)
            
            yield {
                "status": "found_paper",
                "paper": paper_info,
                "message": f"Found: {result.title}"
            }
        
        yield {
            "status": "completed",
            "papers": papers,
            "count": len(papers),
            "message": f"Found {len(papers)} papers"
        }
    
    async def _async_search(self, search):
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(None, lambda: list(search.results()))
        for result in results:
            yield result