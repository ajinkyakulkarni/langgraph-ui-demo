from abc import ABC, abstractmethod
from typing import Any, Dict, AsyncIterator
from langchain.schema import BaseMessage

class BaseAgent(ABC):
    def __init__(self, config: Dict[str, Any]):
        self.config = config
    
    @abstractmethod
    async def process(self, input_data: Any) -> AsyncIterator[Dict[str, Any]]:
        pass
    
    async def apply_guardrails(self, data: Any, guardrails: list) -> Any:
        for guardrail in guardrails:
            data = await guardrail.validate(data)
        return data