from typing import Dict, Any, AsyncIterator
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from app.agents.base import BaseAgent

class SummarizerAgent(BaseAgent):
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.llm = ChatOpenAI(temperature=0, model="gpt-3.5-turbo-16k")
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a research summarizer. Your task is to synthesize 
            information from multiple sources into a coherent summary. Focus on:
            1. Key findings and insights
            2. Common themes across sources
            3. Contradictions or debates
            4. Practical implications
            
            Provide a well-structured summary that is informative yet concise."""),
            ("human", "Please summarize the following information:\n\n{content}")
        ])
    
    async def process(self, input_data: Any) -> AsyncIterator[Dict[str, Any]]:
        yield {"status": "analyzing", "message": "Analyzing content..."}
        
        # Extract content to summarize
        content = input_data.get("content", "")
        if isinstance(content, list):
            # Join list items
            content = "\n\n".join([str(item) for item in content])
        
        # Apply input guardrails if configured
        if self.config.get("input_guardrails"):
            for guardrail_name in self.config["input_guardrails"]:
                # Apply guardrail
                pass
        
        yield {"status": "summarizing", "message": "Generating summary..."}
        
        # Generate summary
        chain = self.prompt | self.llm
        response = await chain.ainvoke({"content": content})
        
        summary = response.content
        
        # Apply output guardrails if configured
        if self.config.get("output_guardrails"):
            for guardrail_name in self.config["output_guardrails"]:
                # Apply guardrail
                pass
        
        # Extract key points
        key_points = self._extract_key_points(summary)
        
        yield {
            "status": "completed",
            "summary": summary,
            "key_points": key_points,
            "word_count": len(summary.split()),
            "message": "Summary generated successfully"
        }
    
    def _extract_key_points(self, summary: str) -> list:
        # Simple extraction - in production use NLP
        lines = summary.split('\n')
        key_points = []
        
        for line in lines:
            line = line.strip()
            if line and (line.startswith('-') or line.startswith('•') or line[0].isdigit()):
                key_points.append(line.lstrip('-•1234567890. '))
        
        return key_points[:5]  # Top 5 key points